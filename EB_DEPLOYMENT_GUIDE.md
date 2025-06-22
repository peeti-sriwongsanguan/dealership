# AWS Elastic Beanstalk Deployment Guide

This document provides step-by-step instructions for deploying your Auto Service Management System to AWS Elastic Beanstalk.

## Prerequisites

- AWS Account
- AWS CLI installed and configured
- Elastic Beanstalk CLI (eb-cli) installed
- Python 3.8+ with pip
- Git (optional but recommended)

## Step 1: Install Required Tools

```bash
# Install AWS CLI
pip install awscli

# Install EB CLI
pip install awsebcli

# Configure AWS credentials (you'll need your Access Key and Secret Key)
aws configure
```

## Step 2: Prepare Your Application

Your application is already configured for Elastic Beanstalk deployment with the following files:

- `application.py` - The main Flask application that Elastic Beanstalk will run
- `.ebextensions/01_flask.config` - Configuration for Python environment in Elastic Beanstalk
- `.ebignore` - Files to ignore during deployment
- `Procfile` - Process file for running the application with Gunicorn
- `requirements.txt` - Python dependencies

Ensure all these files are in your project directory.

## Step 3: Initialize Elastic Beanstalk Application

In your project directory, run:

```bash
# Initialize EB application
eb init -p python-3.8 auto-service-app

# When prompted:
# - Select your AWS region
# - Create a new application or use an existing one
# - Choose to use CodeCommit (optional)
# - Choose to set up SSH (recommended for troubleshooting)
```

## Step 4: Create an Elastic Beanstalk Environment

```bash
# Create a new environment with a custom name
eb create auto-service-production

# This might take several minutes to complete
```

## Step 5: Database Options

### Option A: Using SQLite Database (Simplest)

This is configured by default in the `.ebextensions/01_flask.config` file. The database will be created in the EC2 instance's file system at `/var/app/current/data/ol_service_pos.db`.

**Note:** This approach is simpler but has limitations:
- The database is on the instance's filesystem, so data will be lost if the instance is replaced
- Not suitable for production applications with valuable data
- Limited scalability (single instance only)

### Option B: Using Amazon RDS (Recommended for Production)

To use RDS (PostgreSQL):

1. Create an RDS instance in the AWS Console
2. Update your `application.py` to connect to PostgreSQL
3. Update your environment variables through the EB Console:

```bash
# Set environment variables for RDS
eb setenv DB_TYPE=postgres DB_HOST=your-rds-endpoint.rds.amazonaws.com DB_NAME=auto_service DB_USER=postgres DB_PASSWORD=your-password
```

## Step 6: Deploy Your Application

```bash
# Deploy to Elastic Beanstalk
eb deploy
```

## Step 7: Open Your Application

```bash
eb open
```

This will open your web browser to your deployed application.

## Step 8: Monitoring and Logs

```bash
# View environment status
eb status

# View logs
eb logs

# SSH into the EC2 instance (if you set up SSH)
eb ssh
```

## Updating Your Application

After making changes to your code:

```bash
# Deploy the updated code
eb deploy
```

## Scaling Your Application

1. Go to the Elastic Beanstalk Console
2. Select your environment
3. Go to "Configuration" > "Capacity"
4. Modify the Auto Scaling settings to add more instances

## Cleaning Up

When you're done with your environment:

```bash
# Terminate the environment
eb terminate auto-service-production
```

**Warning:** This will delete all resources associated with the environment, including any data stored on the EC2 instance.

## Troubleshooting

### Application Fails to Start

Check the logs:
```bash
eb logs
```

Common issues:
- Missing dependencies in requirements.txt
- Permissions issues with the database or photos directory
- Environment variables not set correctly

### Database Connection Issues

If using RDS:
- Check security group settings to ensure the EB environment can connect to RDS
- Verify the database credentials are correct
- Make sure the database exists in RDS

## Next Steps

- Set up HTTPS with AWS Certificate Manager
- Configure a custom domain name
- Set up a CI/CD pipeline with AWS CodePipeline
- Configure CloudWatch alarms for monitoring