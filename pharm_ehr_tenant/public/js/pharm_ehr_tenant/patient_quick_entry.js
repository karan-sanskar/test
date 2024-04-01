frappe.provide('frappe.ui.form');

frappe.ui.form.PatientQuickEntryForm = class PatientQuickEntryForm extends frappe.ui.form.QuickEntryForm {

	constructor(doctype, after_insert, init_callback, doc, force) {
		super(doctype, after_insert, init_callback, doc, force);
		this.skip_redirect_on_error = true;
	}

	render_dialog() {

		this.mandatory = this.get_standard_fields();

		super.render_dialog();

	}

	get_standard_fields() {
		return [
			{
				label: __('First Name'),
				fieldname: 'first_name',
				fieldtype: 'Data'
			},
			{
				label: __('Middle Name'),
				fieldname: 'middle_name',
				fieldtype: 'Data'
			},
			{
				label: __('last Name'),
				fieldname: 'last_name',
				fieldtype: 'Data',
				reqd:1
			},
			{
				fieldtype: 'Section Break',
				collapsible: 0
			},
			{
				label: __('Gender'),
				fieldname: 'sex',
				fieldtype: 'Link',
				options: "Gender"
			},
			{
				fieldtype: 'Column Break'
			},
			{
				label: __('Birth Date'),
				fieldname: 'dob',
				fieldtype: 'Date'
			},
			{
				fieldtype: 'Section Break',
				label: __('Primary Contact'),
				collapsible: 0

			},
			{
				label: __('Email Id'),
				fieldname: 'email',
				fieldtype: 'Data',
				options: 'Email',
				reqd:1
			},
			{
				fieldtype: 'Column Break'
			},
			{
				label: __('Mobile Number'),
				fieldname: 'mobile',
				fieldtype: 'Data',
				reqd:1
			},
			{
				fieldtype: 'Section Break',
				label: __('Primary Address'),
			},
			{
				label: __('Address Line 1'),
				fieldname: 'address_line1',
				fieldtype: 'Data'
			},
			{
				label: __('Address Line 2'),
				fieldname: 'address_line2',
				fieldtype: 'Data'
			},
			{
				label: __('ZIP Code'),
				fieldname: 'pincode',
				fieldtype: 'Data'
			},
			{
				label: __('Invite as User'),
				fieldname: 'invite_user',
				fieldtype: 'Check'
			},
			{
				fieldtype: 'Column Break'
			},
			{
				label: __('City'),
				fieldname: 'city',
				fieldtype: 'Data'
			},
			{
				label: __('State'),
				fieldname: 'state',
				fieldtype: 'Data'
			},
			{
				label: __('Country'),
				fieldname: 'country',
				fieldtype: 'Link',
				options: 'Country',
				default: frappe.defaults.get_global_default("country")
			}
		];
	}
}