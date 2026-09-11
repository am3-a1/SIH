"""
Role-Based Access Control (RBAC) Module
SIH26095 - Ministry of Social Justice and Empowerment (MoSJE)
Defines roles, hierarchical permissions, and access guards for DoSJE APIs.
"""

from enum import Enum
from typing import List, Set


class Role(str, Enum):
    NATIONAL_ADMIN = "NATIONAL_ADMIN"         # MoSJE Central Ministry Admin
    STATE_OFFICER = "STATE_OFFICER"           # State Social Welfare Officer
    DISTRICT_INSPECTOR = "DISTRICT_INSPECTOR" # Field Inspection Officer (Mobile App)
    SURPRISE_AUDITOR = "SURPRISE_AUDITOR"     # Flying Squad / Unannounced Auditor
    FACILITY_HEAD = "FACILITY_HEAD"           # NGO / Residential Institute In-Charge


# Granular Permissions
class Permission(str, Enum):
    VIEW_NATIONAL_METRICS = "view_national_metrics"
    TRIGGER_AI_DISPATCH = "trigger_ai_dispatch"
    VIEW_CCTV_FEEDS = "view_cctv_feeds"
    CONTROL_PTZ = "control_ptz"
    INITIATE_REMOTE_VC = "initiate_remote_vc"
    EXECUTE_FIELD_INSPECTION = "execute_field_inspection"
    APPROVE_INSPECTION = "approve_inspection"
    ISSUE_SANCTION_NOTICE = "issue_sanction_notice"
    VIEW_FACILITY_PROFILE = "view_facility_profile"
    SUBMIT_CORRECTIVE_ACTION = "submit_corrective_action"
    EXPORT_AUDIT_REPORTS = "export_audit_reports"


# Role-Permission Mapping Matrix
ROLE_PERMISSIONS: dict[Role, Set[Permission]] = {
    Role.NATIONAL_ADMIN: {
        Permission.VIEW_NATIONAL_METRICS,
        Permission.TRIGGER_AI_DISPATCH,
        Permission.VIEW_CCTV_FEEDS,
        Permission.CONTROL_PTZ,
        Permission.INITIATE_REMOTE_VC,
        Permission.EXECUTE_FIELD_INSPECTION,
        Permission.APPROVE_INSPECTION,
        Permission.ISSUE_SANCTION_NOTICE,
        Permission.VIEW_FACILITY_PROFILE,
        Permission.SUBMIT_CORRECTIVE_ACTION,
        Permission.EXPORT_AUDIT_REPORTS,
    },
    Role.STATE_OFFICER: {
        Permission.VIEW_NATIONAL_METRICS,
        Permission.TRIGGER_AI_DISPATCH,
        Permission.VIEW_CCTV_FEEDS,
        Permission.INITIATE_REMOTE_VC,
        Permission.APPROVE_INSPECTION,
        Permission.VIEW_FACILITY_PROFILE,
        Permission.EXPORT_AUDIT_REPORTS,
    },
    Role.DISTRICT_INSPECTOR: {
        Permission.EXECUTE_FIELD_INSPECTION,
        Permission.VIEW_FACILITY_PROFILE,
        Permission.VIEW_CCTV_FEEDS,
    },
    Role.SURPRISE_AUDITOR: {
        Permission.EXECUTE_FIELD_INSPECTION,
        Permission.INITIATE_REMOTE_VC,
        Permission.VIEW_CCTV_FEEDS,
        Permission.CONTROL_PTZ,
        Permission.VIEW_FACILITY_PROFILE,
        Permission.APPROVE_INSPECTION,
    },
    Role.FACILITY_HEAD: {
        Permission.VIEW_FACILITY_PROFILE,
        Permission.SUBMIT_CORRECTIVE_ACTION,
    }
}


def check_permission(user_role: str, permission: Permission) -> bool:
    """Checks if a user role has the required permission."""
    try:
        role_enum = Role(user_role)
        return permission in ROLE_PERMISSIONS.get(role_enum, set())
    except ValueError:
        return False


def can_inspect_facility(user_role: str, user_district: str, facility_district: str) -> bool:
    """Validates jurisdictional boundaries for inspection officers."""
    if user_role in [Role.NATIONAL_ADMIN, Role.STATE_OFFICER, Role.SURPRISE_AUDITOR]:
        return True
    if user_role == Role.DISTRICT_INSPECTOR:
        return user_district.lower() == facility_district.lower() or user_district == "ALL"
    return False
