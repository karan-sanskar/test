app_name = "pharm_ehr_tenant"
app_title = "Pharm Ehr Tenant"
app_publisher = "Aerele"
app_description = "Pharm Ehr Tenant"
app_email = "hello@aerele.in"
app_license = "mit"
# required_apps = []

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
# app_include_css = "/assets/pharm_ehr_tenant/css/pharm_ehr_tenant.css"
# app_include_js = "/assets/pharm_ehr_tenant/js/pharm_ehr_tenant.js"

# include js, css files in header of web template
# web_include_css = "/assets/pharm_ehr_tenant/css/pharm_ehr_tenant.css"
# web_include_js = "/assets/pharm_ehr_tenant/js/pharm_ehr_tenant.js"

# include custom scss in every website theme (without file extension ".scss")
# website_theme_scss = "pharm_ehr_tenant/public/scss/website"

# include js, css files in header of web form
# webform_include_js = {"doctype": "public/js/doctype.js"}
# webform_include_css = {"doctype": "public/css/doctype.css"}

# include js in page
# page_js = {"page" : "public/js/file.js"}
app_include_js = [
    "pharm.bundle.js"
]
# include js in doctype views
# doctype_js = {"doctype" : "public/js/doctype.js"}
doctype_js = {"Medication" : "public/js/custom_medication.js",
            "Sales Invoice": "public/js/sales_invoice.js",
            "Patient": "public/js/patient.js",
            "Event" : "public/js/event.js",
            "Medication" : "public/js/medication.js",
            "Medication Class" : "public/js/medication_class.js",
            "Appointment Type":"public/js/appointment_type.js",
            "Patient Appointment":"public/js/patient_appointment.js"
         }

doctype_list_js = {"Patient": "public/js/patient_list.js",
                  "Patient Appointment":"public/js/patient_appointment_list.js" }

# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Svg Icons
# ------------------
# include app icons in desk
# app_include_icons = "pharm_ehr_tenant/public/icons.svg"

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
# 	"Role": "home_page"
# }

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# Jinja
# ----------

# add methods and filters to jinja environment
# jinja = {
# 	"methods": "pharm_ehr_tenant.utils.jinja_methods",
# 	"filters": "pharm_ehr_tenant.utils.jinja_filters"
# }

jinja = {
    "methods": "pharm_ehr_tenant.pharm_ehr_tenant.utils.get_default_compnay",
}

# Installation
# ------------

# before_install = "pharm_ehr_tenant.install.before_install"
# after_install = "pharm_ehr_tenant.install.after_install"

after_migrate = "pharm_ehr_tenant.migrate.after_migrate"

# Uninstallation
# ------------

# before_uninstall = "pharm_ehr_tenant.uninstall.before_uninstall"
# after_uninstall = "pharm_ehr_tenant.uninstall.after_uninstall"

# Integration Setup
# ------------------
# To set up dependencies/integrations with other apps
# Name of the app being installed is passed as an argument

# before_app_install = "pharm_ehr_tenant.utils.before_app_install"
# after_app_install = "pharm_ehr_tenant.utils.after_app_install"

# Integration Cleanup
# -------------------
# To clean up dependencies/integrations with other apps
# Name of the app being uninstalled is passed as an argument

# before_app_uninstall = "pharm_ehr_tenant.utils.before_app_uninstall"
# after_app_uninstall = "pharm_ehr_tenant.utils.after_app_uninstall"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "pharm_ehr_tenant.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
# 	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
# 	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# DocType Class
# ---------------
# Override standard doctype classes

# override_doctype_class = {
# 	"ToDo": "custom_app.overrides.CustomToDo"
# }


override_doctype_class = {
    "Patient Appointment": "pharm_ehr_tenant.overrides.CustomPatientAppointment",
    "Stripe Settings": "pharm_ehr_tenant.overrides.CustomStripeSettings"
}

# Document Events
# ---------------
# Hook on document methods and events


doc_events = {
    "Sales Invoice": {
        "on_update_after_submit": ["pharm_ehr_tenant.pharm_ehr_tenant.utils.on_update_after_submit"],
        "before_save": ["pharm_ehr_tenant.pharm_ehr_tenant.utils.validate_sales_invoice"]
    },
    "Patient": {
        "before_save": ["pharm_ehr_tenant.pharm_ehr_tenant.utils.update_gender"]
    },
    "Event": {
        "before_save": ["pharm_ehr_tenant.pharm_ehr_tenant.utils.set_questionnaire_template"]
    }
    # "Patient":{
    #     "autoname":"pharm_ehr_tenant.pharm_ehr_tenant.utils.autoname"
    # }
}


# doc_events = {
# 	"*": {
# 		"on_update": "method",
# 		"on_cancel": "method",
# 		"on_trash": "method"
# 	}
# }

# Scheduled Tasks
# ---------------

# scheduler_events = {
# 	"all": [
# 		"pharm_ehr_tenant.tasks.all"
# 	],
# 	"daily": [
# 		"pharm_ehr_tenant.tasks.daily"
# 	],
# 	"hourly": [
# 		"pharm_ehr_tenant.tasks.hourly"
# 	],
# 	"weekly": [
# 		"pharm_ehr_tenant.tasks.weekly"
# 	],
# 	"monthly": [
# 		"pharm_ehr_tenant.tasks.monthly"
# 	],
# }
# fixtures = ["Recreational Drug","Medical Condition", "Relative", "Surgery", "Environmental Answer", "Environmental Question"]
#Medication,Item,code value - pending fixtures
fixtures  = [
    "Recreational Drug","Medical Condition", "Relative", "Surgery", "Environmental Answer", "Environmental Question","Workflow State","Workflow Action Master","Allergy","Appointment Type","Code System","Email Template","Question Doctype","Questionnaires Template","Patient Eligibility Template",
    {        "dt": 'Workflow',
        "filters": [            ["name", "in",
                [                    "CMR Service workflow","Immunization Service"
                ]            ]
        ]    },
    {        "dt": 'Role',
        "filters": [            ["name", "in",
                [                    "Healthcare Staff",
                                     "Pharmacist",
                                     "Healthcare Manager"
                ]            ]
        ]    },
    {        "dt": 'Role Profile',
    "filters": [            ["name", "in",
            [                    "Healthcare (All)",
                                    "Healthcare Staff",
                                    "Pharmacist"
            ]            ]
        ]    },
         {        "dt": 'Module Profile',
        "filters": [            ["name", "in",
                [                    "Healthcare module"
                ]            ]
        ]    },
        {        "dt": 'Property Setter',
        "filters": [            ["name", "in",
                [                    "Patient Appointment-status-options",
                                     "Patient-naming_series-options"
                                     "Patient-naming_series-default",
                                     'Event-main-links_order'
                ]            ]
        ]    },
        {        "dt": 'Translation',
        "filters": [            ["name", "in",
                [                    "6889835f94","dbe9e6ec6a"
                ]            ]
        ]    },
        {"dt": 'Role',
        "filters": [            ["name", "in",
                [                    "RxBB - Tenant Administrator","RxBB - Technician","RxBB - Pharmacist & Technician","RxBB - Medical Billing","RxBB - Contract Provider"
                ]            ]
        ]    },
        {"dt": 'Web Template',
        "filters": [            ["name", "in",
                [                    "RXBB Footer"
                ]            ]
        ]    },
        {"dt": 'UOM',
        "filters": [            ["name", "in",
                [                    "mg"
                ]            ]
        ]    },
        {"dt": 'Medication Class',
        "filters": [            ["name", "in",
                [                    "Medication"
                ]            ]
        ]    },
        {"dt": 'Item Group',
        "filters": [            ["name", "in",
                [                    "CMR Service",
                                     "Immunization Service"
                ]            ]
        ]    },
        {"dt": 'Code Value',
        "filters": [            ["name", "in",
                [                    "(0 - 15)-99605",
                                     "(15 - 30)-99607",
                                     "(30 - 45)-99607",
                                     "(45 - 60)-99607"
                ]            ]
        ]    }
]
# Testing
# -------

# before_tests = "pharm_ehr_tenant.install.before_tests"

# Overriding Methods
# ------------------------------
#
# override_whitelisted_methods = {
# 	"frappe.desk.doctype.event.event.get_events": "pharm_ehr_tenant.event.get_events"
# }
#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
# 	"Task": "pharm_ehr_tenant.task.get_dashboard_data"
# }

# exempt linked doctypes from being automatically cancelled
#
# auto_cancel_exempted_doctypes = ["Auto Repeat"]

# Ignore links to specified DocTypes when deleting documents
# -----------------------------------------------------------

# ignore_links_on_delete = ["Communication", "ToDo"]

# Request Events
# ----------------
# before_request = ["pharm_ehr_tenant.utils.before_request"]
# after_request = ["pharm_ehr_tenant.utils.after_request"]

# Job Events
# ----------
# before_job = ["pharm_ehr_tenant.utils.before_job"]
# after_job = ["pharm_ehr_tenant.utils.after_job"]

# User Data Protection
# --------------------

# user_data_fields = [
# 	{
# 		"doctype": "{doctype_1}",
# 		"filter_by": "{filter_by}",
# 		"redact_fields": ["{field_1}", "{field_2}"],
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_2}",
# 		"filter_by": "{filter_by}",
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_3}",
# 		"strict": False,
# 	},
# 	{
# 		"doctype": "{doctype_4}"
# 	}
# ]

# Authentication and authorization
# --------------------------------

# auth_hooks = [
# 	"pharm_ehr_tenant.auth.validate"
# ]

# Automatically update python controller files with type annotations for this app.
# export_python_type_annotations = True

# default_log_clearing_doctypes = {
# 	"Logging DocType Name": 30  # days to retain logs
# }


website_route_rules = [{'from_route': '/webform/<path:app_path>', 'to_route': 'webform'}]
