import frappe
from pharm_ehr_tenant.pharm_ehr_tenant.doctype.year.year import create_default_years

def after_migrate():
    create_property_setters()
    create_default_years()
    remove_gender()
    update_setting_fields()

@frappe.whitelist()
def remove_gender():
    frappe.db.sql("DELETE FROM `tabGender` WHERE name not in ('Male', 'Female')")
    print("deleting genders")


def create_property_setters():
    if not frappe.db.exists("Property Setter", "Patient-status-options"):
        frappe.get_doc(
                {
                    "doctype": "Property Setter",
                    "doc_type": "Patient",
                    "doctype_or_field": "DocField",
                    "field_name": "status",
                    "property": "options",
                    "propery_type": "Select",
                    "value": "Active\nInactive\nTransferred",
                }
            ).db_insert()

    # if not frappe.db.exists("Property Setter", "Patient-sex-reqd"):
    #     frappe.get_doc(
    #             {
    #                 "doctype": "Property Setter",
    #                 "doc_type": "Patient",
    #                 "doctype_or_field": "DocField",
    #                 "field_name": "sex",
    #                 "property": "reqd",
    #                 "value": 0,
    #             }
    #         ).db_insert()
    # if not frappe.db.exists("Property Setter", "Patient-sex-read_only"):
    #     frappe.get_doc(
    #                 {
    #                     "doctype": "Property Setter",
    #                     "doc_type": "Patient",
    #                     "doctype_or_field": "DocField",
    #                     "field_name": "sex",
    #                     "property": "read_only",
    #                     "property_type":"Check",
    #                     "default_value":"Male",
    #                     "value": 1,
    #                 }
    #             ).db_insert()
def update_setting_fields():
    # doc = frappe.get_doc("System Settings","System Settings")
    # if not doc.disable_standard_email_footer:
    #     doc.disable_standard_email_footer = 1
    #     doc.ignore_mandatory = True
    #     doc.save(ignore_permissions = True)
    web = frappe.get_doc("Website Settings","Website Settings")
    web.title_prefix = ""
    web.app_name = "RXBlackBerry"
    web.app_logo = "/files/PharmEHR-Logo.png"
    web.disable_signup = 1
    web.banner_image = "/files/PharmEHR-Logo.png"
    web.splash_image = "/files/PharmEHR-Logo.png"
    web.brand_html = "<img src='/files/PharmEHR-Logo.png'>"
    web.hide_login = 1
    web.copyright = "Copyright 2024 RxBB.io, LLC. All rights reserved."
    web.hide_footer_signup = 1
    web.footer_template = "RXBB Footer"
    web.save(ignore_permissions = True)

    #setting app_logo
    navbar = frappe.get_doc("Navbar Settings","Navbar Settings")
    navbar.app_logo = "/files/PharmEHR-Logo.png"
    navbar.save(ignore_permissions = True)

    #default patient name by series
    health_setting = frappe.get_doc("Healthcare Settings","Healthcare Settings")
    health_setting.patient_name_by = "Naming Series"
    health_setting.save(ignore_permissions = True)
