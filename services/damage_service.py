# services/damage_service.py
"""
Damage Management Service for OL Service POS System
Handles damage point tracking, analysis, and reporting
"""

import json
import uuid
from datetime import datetime
from typing import List, Dict, Optional, Tuple, Any
from dataclasses import dataclass, asdict
from pathlib import Path

from database.connection_manager import db_manager


@dataclass
class DamagePoint:
    """Represents a single damage point on a vehicle"""
    id: str
    x: float  # Normalized x coordinate (0.0 to 1.0)
    y: float  # Normalized y coordinate (0.0 to 1.0)
    damage_type: str  # Scratch, Dent, Rust, etc.
    severity: str  # Minor, Moderate, Severe
    description: str = ""
    estimated_cost: float = 0.0
    created_at: Optional[datetime] = None

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        data = asdict(self)
        if self.created_at:
            data['created_at'] = self.created_at.isoformat()
        return data

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'DamagePoint':
        """Create DamagePoint from dictionary"""
        if 'created_at' in data and isinstance(data['created_at'], str):
            data['created_at'] = datetime.fromisoformat(data['created_at'])
        return cls(**data)


@dataclass
class DamageReport:
    """Represents a complete damage assessment report"""
    id: int
    customer_id: int
    vehicle_id: int
    vehicle_type: str
    damage_points: List[DamagePoint]
    total_estimated_cost: float = 0.0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    notes: str = ""

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()
        if self.updated_at is None:
            self.updated_at = datetime.now()

    def calculate_total_cost(self) -> float:
        """Calculate total estimated cost from all damage points"""
        self.total_estimated_cost = sum(point.estimated_cost for point in self.damage_points)
        return self.total_estimated_cost

    def get_damage_summary(self) -> Dict[str, int]:
        """Get summary of damage types and counts"""
        summary = {}
        for point in self.damage_points:
            damage_type = point.damage_type
            summary[damage_type] = summary.get(damage_type, 0) + 1
        return summary

    def get_severity_summary(self) -> Dict[str, int]:
        """Get summary of damage severity levels"""
        summary = {}
        for point in self.damage_points:
            severity = point.severity
            summary[severity] = summary.get(severity, 0) + 1
        return summary


class DamageAnalyzer:
    """Analyzes damage patterns and provides insights"""

    def __init__(self):
        self.damage_types = {
            'Scratch': {'base_cost': 50, 'multiplier': 1.0},
            'Dent': {'base_cost': 100, 'multiplier': 1.5},
            'Rust': {'base_cost': 150, 'multiplier': 2.0},
            'Paint Damage': {'base_cost': 75, 'multiplier': 1.2},
            'Crack': {'base_cost': 200, 'multiplier': 2.5},
            'Structural': {'base_cost': 500, 'multiplier': 3.0}
        }

        self.severity_multipliers = {
            'Minor': 1.0,
            'Moderate': 1.8,
            'Severe': 3.0
        }

    def estimate_damage_cost(self, damage_point: DamagePoint) -> float:
        """Estimate repair cost for a single damage point"""
        damage_info = self.damage_types.get(damage_point.damage_type, {'base_cost': 100, 'multiplier': 1.0})
        severity_mult = self.severity_multipliers.get(damage_point.severity, 1.0)

        base_cost = damage_info['base_cost']
        type_multiplier = damage_info['multiplier']

        estimated_cost = base_cost * type_multiplier * severity_mult
        return round(estimated_cost, 2)

    def analyze_damage_patterns(self, damage_points: List[DamagePoint]) -> Dict[str, Any]:
        """Analyze damage patterns and provide insights"""
        if not damage_points:
            return {'total_points': 0, 'insights': []}

        analysis = {
            'total_points': len(damage_points),
            'damage_types': {},
            'severity_distribution': {},
            'cost_analysis': {},
            'spatial_analysis': {},
            'insights': []
        }

        # Analyze damage types
        for point in damage_points:
            damage_type = point.damage_type
            analysis['damage_types'][damage_type] = analysis['damage_types'].get(damage_type, 0) + 1

        # Analyze severity distribution
        for point in damage_points:
            severity = point.severity
            analysis['severity_distribution'][severity] = analysis['severity_distribution'].get(severity, 0) + 1

        # Cost analysis
        total_cost = sum(self.estimate_damage_cost(point) for point in damage_points)
        analysis['cost_analysis'] = {
            'total_estimated_cost': total_cost,
            'average_cost_per_point': total_cost / len(damage_points) if damage_points else 0,
            'cost_by_type': {}
        }

        # Cost by damage type
        for damage_type in analysis['damage_types']:
            type_points = [p for p in damage_points if p.damage_type == damage_type]
            type_cost = sum(self.estimate_damage_cost(point) for point in type_points)
            analysis['cost_analysis']['cost_by_type'][damage_type] = type_cost

        # Spatial analysis
        x_coords = [p.x for p in damage_points]
        y_coords = [p.y for p in damage_points]

        analysis['spatial_analysis'] = {
            'center_x': sum(x_coords) / len(x_coords),
            'center_y': sum(y_coords) / len(y_coords),
            'spread_x': max(x_coords) - min(x_coords) if x_coords else 0,
            'spread_y': max(y_coords) - min(y_coords) if y_coords else 0
        }

        # Generate insights
        insights = self._generate_insights(analysis, damage_points)
        analysis['insights'] = insights

        return analysis

    def _generate_insights(self, analysis: Dict[str, Any], damage_points: List[DamagePoint]) -> List[str]:
        """Generate insights based on damage analysis"""
        insights = []

        # High-cost insights
        total_cost = analysis['cost_analysis']['total_estimated_cost']
        if total_cost > 1000:
            insights.append(f"High repair cost detected: ${total_cost:,.2f}")

        # Severity insights
        severe_count = analysis['severity_distribution'].get('Severe', 0)
        if severe_count > 0:
            insights.append(f"{severe_count} severe damage point(s) require immediate attention")

        # Pattern insights
        if len(analysis['damage_types']) == 1:
            damage_type = list(analysis['damage_types'].keys())[0]
            insights.append(f"Consistent damage pattern: All damage points are {damage_type}")

        # Spatial insights
        spatial = analysis['spatial_analysis']
        if spatial['spread_x'] < 0.3 and spatial['spread_y'] < 0.3:
            insights.append("Damage is concentrated in a small area")
        elif spatial['spread_x'] > 0.7 or spatial['spread_y'] > 0.7:
            insights.append("Damage is widespread across the vehicle")

        # Cost efficiency insights
        cost_by_type = analysis['cost_analysis']['cost_by_type']
        if cost_by_type:
            highest_cost_type = max(cost_by_type, key=cost_by_type.get)
            insights.append(
                f"Most expensive damage type: {highest_cost_type} (${cost_by_type[highest_cost_type]:,.2f})")

        return insights


class DamageService:
    """Main service for managing vehicle damage reports"""

    def __init__(self):
        self.analyzer = DamageAnalyzer()

    def create_damage_report(self, customer_id: int, vehicle_id: int, vehicle_type: str) -> Optional[int]:
        """Create a new damage report"""
        try:
            with db_manager.get_connection() as conn:
                cursor = conn.cursor()

                cursor.execute("""
                    INSERT INTO damage_reports (customer_id, vehicle_id, vehicle_type, damage_points, 
                                              total_estimated_cost, created_at, updated_at, notes)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    customer_id, vehicle_id, vehicle_type, "[]", 0.0,
                    datetime.now().isoformat(), datetime.now().isoformat(), ""
                ))

                report_id = cursor.lastrowid
                conn.commit()
                return report_id

        except Exception as e:
            print(f"Error creating damage report: {e}")
            return None

    def get_damage_report(self, report_id: int) -> Optional[DamageReport]:
        """Retrieve a damage report by ID"""
        try:
            with db_manager.get_connection() as conn:
                cursor = conn.cursor()

                cursor.execute("""
                    SELECT * FROM damage_reports WHERE id = ?
                """, (report_id,))

                row = cursor.fetchone()
                if not row:
                    return None

                # Parse damage points JSON
                damage_points_data = json.loads(row['damage_points'] or "[]")
                damage_points = [DamagePoint.from_dict(point) for point in damage_points_data]

                return DamageReport(
                    id=row['id'],
                    customer_id=row['customer_id'],
                    vehicle_id=row['vehicle_id'],
                    vehicle_type=row['vehicle_type'],
                    damage_points=damage_points,
                    total_estimated_cost=row['total_estimated_cost'] or 0.0,
                    created_at=datetime.fromisoformat(row['created_at']) if row['created_at'] else None,
                    updated_at=datetime.fromisoformat(row['updated_at']) if row['updated_at'] else None,
                    notes=row['notes'] or ""
                )

        except Exception as e:
            print(f"Error retrieving damage report: {e}")
            return None

    def add_damage_point(self, report_id: int, damage_point: DamagePoint) -> bool:
        """Add a damage point to an existing report"""
        try:
            # Get current report
            report = self.get_damage_report(report_id)
            if not report:
                return False

            # Estimate cost for the damage point
            if damage_point.estimated_cost == 0.0:
                damage_point.estimated_cost = self.analyzer.estimate_damage_cost(damage_point)

            # Add the new damage point
            report.damage_points.append(damage_point)
            report.calculate_total_cost()
            report.updated_at = datetime.now()

            # Save updated report
            return self._save_damage_report(report)

        except Exception as e:
            print(f"Error adding damage point: {e}")
            return False

    def remove_damage_point(self, report_id: int, damage_point_id: str) -> bool:
        """Remove a damage point from a report"""
        try:
            report = self.get_damage_report(report_id)
            if not report:
                return False

            # Remove the damage point
            report.damage_points = [p for p in report.damage_points if p.id != damage_point_id]
            report.calculate_total_cost()
            report.updated_at = datetime.now()

            return self._save_damage_report(report)

        except Exception as e:
            print(f"Error removing damage point: {e}")
            return False

    def update_damage_point(self, report_id: int, damage_point: DamagePoint) -> bool:
        """Update an existing damage point"""
        try:
            report = self.get_damage_report(report_id)
            if not report:
                return False

            # Find and update the damage point
            for i, point in enumerate(report.damage_points):
                if point.id == damage_point.id:
                    # Re-estimate cost if needed
                    if damage_point.estimated_cost == 0.0:
                        damage_point.estimated_cost = self.analyzer.estimate_damage_cost(damage_point)

                    report.damage_points[i] = damage_point
                    break
            else:
                return False  # Damage point not found

            report.calculate_total_cost()
            report.updated_at = datetime.now()

            return self._save_damage_report(report)

        except Exception as e:
            print(f"Error updating damage point: {e}")
            return False

    def _save_damage_report(self, report: DamageReport) -> bool:
        """Save a damage report to the database"""
        try:
            with db_manager.get_connection() as conn:
                cursor = conn.cursor()

                # Convert damage points to JSON
                damage_points_json = json.dumps([point.to_dict() for point in report.damage_points])

                cursor.execute("""
                    UPDATE damage_reports 
                    SET damage_points = ?, total_estimated_cost = ?, updated_at = ?, notes = ?
                    WHERE id = ?
                """, (
                    damage_points_json, report.total_estimated_cost,
                    report.updated_at.isoformat(), report.notes, report.id
                ))

                conn.commit()
                return True

        except Exception as e:
            print(f"Error saving damage report: {e}")
            return False

    def get_reports_by_customer(self, customer_id: int) -> List[DamageReport]:
        """Get all damage reports for a customer"""
        try:
            with db_manager.get_connection() as conn:
                cursor = conn.cursor()

                cursor.execute("""
                    SELECT id FROM damage_reports WHERE customer_id = ?
                    ORDER BY created_at DESC
                """, (customer_id,))

                report_ids = [row['id'] for row in cursor.fetchall()]
                return [self.get_damage_report(rid) for rid in report_ids if self.get_damage_report(rid)]

        except Exception as e:
            print(f"Error retrieving customer reports: {e}")
            return []

    def get_reports_by_vehicle(self, vehicle_id: int) -> List[DamageReport]:
        """Get all damage reports for a vehicle"""
        try:
            with db_manager.get_connection() as conn:
                cursor = conn.cursor()

                cursor.execute("""
                    SELECT id FROM damage_reports WHERE vehicle_id = ?
                    ORDER BY created_at DESC
                """, (vehicle_id,))

                report_ids = [row['id'] for row in cursor.fetchall()]
                return [self.get_damage_report(rid) for rid in report_ids if self.get_damage_report(rid)]

        except Exception as e:
            print(f"Error retrieving vehicle reports: {e}")
            return []

    def delete_damage_report(self, report_id: int) -> bool:
        """Delete a damage report"""
        try:
            with db_manager.get_connection() as conn:
                cursor = conn.cursor()

                cursor.execute("DELETE FROM damage_reports WHERE id = ?", (report_id,))
                conn.commit()

                return cursor.rowcount > 0

        except Exception as e:
            print(f"Error deleting damage report: {e}")
            return False

    def generate_damage_summary(self, report: DamageReport) -> Dict[str, Any]:
        """Generate a comprehensive damage summary"""
        analysis = self.analyzer.analyze_damage_patterns(report.damage_points)

        summary = {
            'report_id': report.id,
            'customer_id': report.customer_id,
            'vehicle_id': report.vehicle_id,
            'vehicle_type': report.vehicle_type,
            'created_at': report.created_at.isoformat() if report.created_at else None,
            'total_damage_points': len(report.damage_points),
            'total_estimated_cost': report.total_estimated_cost,
            'damage_breakdown': report.get_damage_summary(),
            'severity_breakdown': report.get_severity_summary(),
            'analysis': analysis,
            'notes': report.notes
        }

        return summary

    def export_damage_report(self, report_id: int, file_path: str) -> bool:
        """Export damage report to JSON file"""
        try:
            report = self.get_damage_report(report_id)
            if not report:
                return False

            summary = self.generate_damage_summary(report)

            with open(file_path, 'w') as f:
                json.dump(summary, f, indent=2, default=str)

            return True

        except Exception as e:
            print(f"Error exporting damage report: {e}")
            return False


# Global damage service instance
damage_service = DamageService()