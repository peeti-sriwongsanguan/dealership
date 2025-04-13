# Deploying to AWS ECS (Elastic Container Service)

This guide provides detailed instructions for deploying the Car Dealer POS web version to AWS ECS for a scalable, production-ready environment.

## Prerequisites

1. AWS account with appropriate permissions
2. AWS CLI installed and configured
3. Docker installed locally
4. Application code with web interface (using the provided `web_api.py`)

## Deployment Steps

### 1. Create an Amazon ECR Repository

Amazon Elastic Container Registry (ECR) will store your Docker images:

```bash
# Create ECR repository
aws ecr create-repository --repository-name car-dealer-pos

# Get the repository URI
ECR_REPO=$(aws ecr describe-repositories --repository-names car-dealer-pos --query 'repositories[0].repositoryUri' --output text)
```

### 2. Build and Push Your Docker Image

```bash
# Log in to ECR
aws ecr get-login-password | docker login --username AWS --password-stdin $ECR_REPO

# Build the web version of your application
docker build -t car-dealer-pos:latest -f Dockerfile.web .

# Tag the image
docker tag car-dealer-pos:latest $ECR_REPO:latest

# Push to ECR
docker push $ECR_REPO:latest
```

### 3. Create an ECS Cluster

```bash
# Create an ECS cluster
aws ecs create-cluster --cluster-name car-dealer-cluster
```

### 4. Set Up the Database

For production, use Amazon RDS instead of SQLite:

1. Go to the RDS console
2. Create a new database (PostgreSQL recommended)
3. Configure security groups to allow access from your ECS tasks
4. Note the endpoint, username, and password

### 5. Configure Secrets and Environment Variables

Store sensitive information in AWS Secrets Manager:

```bash
# Store database credentials
aws secretsmanager create-secret \
    --name car-dealer/db-credentials \
    --description "Database credentials for Car Dealer POS" \
    --secret-string '{"username":"your_db_user","password":"your_db_password"}'

# Store application secrets
aws secretsmanager create-secret \
    --name car-dealer/app-secrets \
    --description "Application secrets for Car Dealer POS" \
    --secret-string '{"FLASK_SECRET_KEY":"your_secure_key"}'
```

### 6. Create an S3 Bucket for File Storage

```bash
# Create S3 bucket for vehicle photos
aws s3 mb s3://car-dealer-photos

# Enable versioning (optional but recommended)
aws s3api put-bucket-versioning --bucket car-dealer-photos --versioning-configuration Status=Enabled
```

### 7. Create a Task Definition

Create a file named `task-definition.json`:

```json
{
  "family": "car-dealer-web",
  "networkMode": "awsvpc",
  "executionRoleArn": "arn:aws:iam::YOUR_ACCOUNT_ID:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::YOUR_ACCOUNT_ID:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "car-dealer-web",
      "image": "YOUR_ECR_REPO_URI:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 8080,
          "hostPort": 8080,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "FLASK_ENV",
          "value": "production"
        },
        {
          "name": "USE_S3_STORAGE",
          "value": "true"
        },
        {
          "name": "S3_BUCKET_NAME",
          "value": "car-dealer-photos"
        },
        {
          "name": "DB_ENGINE",
          "value": "postgresql"
        },
        {
          "name": "DB_HOST",
          "value": "your-db-instance.rds.amazonaws.com"
        },
        {
          "name": "DB_PORT",
          "value": "5432"
        },
        {
          "name": "DB_NAME",
          "value": "car_dealer_db"
        }
      ],
      "secrets": [
        {
          "name": "DB_USER",
          "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT_ID:secret:car-dealer/db-credentials:username::"
        },
        {
          "name": "DB_PASSWORD",
          "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT_ID:secret:car-dealer/db-credentials:password::"
        },
        {
          "name": "FLASK_SECRET_KEY",
          "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT_ID:secret:car-dealer/app-secrets:FLASK_SECRET_KEY::"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/car-dealer-web",
          "awslogs-region": "YOUR_REGION",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": [
          "CMD-SHELL",
          "curl -f http://localhost:8080/health || exit 1"
        ],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ],
  "requiresCompatibilities": [
    "FARGATE"
  ],
  "cpu": "1024",
  "memory": "2048"
}
```

Register the task definition:

```bash
aws ecs register-task-definition --cli-input-json file://task-definition.json
```

### 8. Create IAM Roles

Create necessary IAM roles for ECS tasks:

1. **ecsTaskExecutionRole**: Allows ECS to pull images and publish logs
2. **ecsTaskRole**: Allows your application to access AWS services like S3 and Secrets Manager

### 9. Create a Load Balancer

```bash
# Create security group for the load balancer
aws ec2 create-security-group \
    --group-name car-dealer-lb-sg \
    --description "Security group for Car Dealer load balancer" \
    --vpc-id YOUR_VPC_ID

# Allow incoming HTTP and HTTPS traffic
aws ec2 authorize-security-group-ingress \
    --group-id YOUR_SG_ID \
    --protocol tcp \
    --port 80 \
    --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
    --group-id YOUR_SG_ID \
    --protocol tcp \
    --port 443 \
    --cidr 0.0.0.0/0

# Create load balancer
aws elbv2 create-load-balancer \
    --name car-dealer-lb \
    --subnets YOUR_SUBNET_ID_1 YOUR_SUBNET_ID_2 \
    --security-groups YOUR_SG_ID \
    --type application

# Create target group
aws elbv2 create-target-group \
    --name car-dealer-tg \
    --protocol HTTP \
    --port 8080 \
    --vpc-id YOUR_VPC_ID \
    --target-type ip \
    --health-check-path /health \
    --health-check-interval-seconds 30 \
    --health-check-timeout-seconds 5 \
    --healthy-threshold-count 2 \
    --unhealthy-threshold-count 2

# Create listener
aws elbv2 create-listener \
    --load-balancer-arn YOUR_LB_ARN \
    --protocol HTTP \
    --port 80 \
    --default-actions Type=forward,TargetGroupArn=YOUR_TG_ARN
```

### 10. Create an ECS Service

```bash
# Create security group for ECS tasks
aws ec2 create-security-group \
    --group-name car-dealer-ecs-sg \
    --description "Security group for Car Dealer ECS tasks" \
    --vpc-id YOUR_VPC_ID

# Allow incoming traffic from the load balancer
aws ec2 authorize-security-group-ingress \
    --group-id YOUR_ECS_SG_ID \
    --protocol tcp \
    --port 8080 \
    --source-group YOUR_LB_SG_ID

# Create ECS service
aws ecs create-service \
    --cluster car-dealer-cluster \
    --service-name car-dealer-service \
    --task-definition car-dealer-web:1 \
    --desired-count 2 \
    --launch-type FARGATE \
    --platform-version LATEST \
    --network-configuration "awsvpcConfiguration={subnets=[YOUR_SUBNET_ID_1,YOUR_SUBNET_ID_2],securityGroups=[YOUR_ECS_SG_ID],assignPublicIp=ENABLED}" \
    --load-balancers "targetGroupArn=YOUR_TG_ARN,containerName=car-dealer-web,containerPort=8080" \
    --health-check-grace-period-seconds 60 \
    --scheduling-strategy REPLICA \
    --deployment-configuration "deploymentCircuitBreaker={enable=true,rollback=true},maximumPercent=200,minimumHealthyPercent=50" \
    --enable-execute-command
```

### 11. Set Up Auto Scaling (Optional)

```bash
# Register a scalable target
aws application-autoscaling register-scalable-target \
    --service-namespace ecs \
    --resource-id service/car-dealer-cluster/car-dealer-service \
    --scalable-dimension ecs:service:DesiredCount \
    --min-capacity 2 \
    --max-capacity 10

# Create scaling policy based on CPU utilization
aws application-autoscaling put-scaling-policy \
    --service-namespace ecs \
    --resource-id service/car-dealer-cluster/car-dealer-service \
    --scalable-dimension ecs:service:DesiredCount \
    --policy-name cpu-tracking-scaling-policy \
    --policy-type TargetTrackingScaling \
    --target-tracking-scaling-policy-configuration "{ \
        \"TargetValue\": 70.0, \
        \"PredefinedMetricSpecification\": { \
            \"PredefinedMetricType\": \"ECSServiceAverageCPUUtilization\" \
        }, \
        \"ScaleOutCooldown\": 300, \
        \"ScaleInCooldown\": 300 \
    }"
```

### 12. Set Up CloudFront (Optional)

For better performance and caching of static assets:

```bash
# Create CloudFront distribution
aws cloudfront create-distribution \
    --origin-domain-name YOUR_LB_DNS_NAME \
    --default-root-object index.html \
    --enabled \
    --default-cache-behavior "{ \
        \"TargetOriginId\": \"ELB-YOUR_LB_DNS_NAME\", \
        \"ViewerProtocolPolicy\": \"redirect-to-https\", \
        \"AllowedMethods\": { \
            \"Quantity\": 7, \
            \"Items\": [\"GET\", \"HEAD\", \"OPTIONS\", \"PUT\", \"POST\", \"PATCH\", \"DELETE\"] \
        }, \
        \"CachePolicyId\": \"4135ea2d-6df8-44a3-9df3-4b5a84be39ad\" \
    }"
```

### 13. Set Up Domain and SSL (Optional)

1. Register a domain in Route 53 or use an existing one
2. Request an SSL certificate in AWS Certificate Manager
3. Configure your CloudFront distribution or load balancer to use the certificate
4. Create DNS records to point to your CloudFront distribution or load balancer

## Monitoring and Maintenance

1. **Set up CloudWatch Alarms**:
   ```bash
   aws cloudwatch put-metric-alarm \
       --alarm-name car-dealer-high-cpu \
       --alarm-description "Alarm when CPU exceeds 80%" \
       --metric-name CPUUtilization \
       --namespace AWS/ECS \
       --statistic Average \
       --period 300 \
       --threshold 80 \
       --comparison-operator GreaterThanThreshold \
       --dimensions Name=ClusterName,Value=car-dealer-cluster Name=ServiceName,Value=car-dealer-service \
       --evaluation-periods 2 \
       --alarm-actions YOUR_SNS_TOPIC_ARN
   ```

2. **Set up automatic database backups for RDS**:
   ```bash
   aws rds modify-db-instance \
       --db-instance-identifier your-db-instance \
       --backup-retention-period 7 \
       --preferred-backup-window "00:00-01:00"
   ```

3. **Configure AWS CloudTrail for audit logging**:
   ```bash
   aws cloudtrail create-trail \
       --name car-dealer-audit-trail \
       --s3-bucket-name your-audit-logs-bucket \
       --is-multi-region-trail
   ```

## Cleanup

To avoid unnecessary AWS charges when you're done:

```bash
# Delete ECS service
aws ecs update-service --cluster car-dealer-cluster --service car-dealer-service --desired-count 0
aws ecs delete-service --cluster car-dealer-cluster --service car-dealer-service

# Delete ECS cluster
aws ecs delete-cluster --cluster car-dealer-cluster

# Delete load balancer
aws elbv2 delete-load-balancer --load-balancer-arn YOUR_LB_ARN

# Delete target group
aws elbv2 delete-target-group --target-group-arn YOUR_TG_ARN

# Delete security groups
aws ec2 delete-security-group --group-id YOUR_LB_SG_ID
aws ec2 delete-security-group --group-id YOUR_ECS_SG_ID
```

## Troubleshooting

1. **Service won't start**:
   - Check the service events: `aws ecs describe-services --cluster car-dealer-cluster --services car-dealer-service`
   - Check task stopped reason: `aws ecs describe-tasks --cluster car-dealer-cluster --tasks YOUR_TASK_ID`

2. **Container health check fails**:
   - Check container logs: `aws logs get-log-events --log-group-name /ecs/car-dealer-web --log-stream-name YOUR_LOG_STREAM`

3. **Database connection issues**:
   - Verify security group settings
   - Check environment variables and secrets

4. **Not enough IAM permissions**:
   - Verify IAM role policies for task execution and task roles