// Copyright (c) 2016, ESS LLP and contributors
// For license information, please see license.txt

frappe.ui.form.on('Appointment Type', {
	refresh: function(frm) {
		$(".row.form-dashboard-section.form-links").hide()
		frm.set_query('custom_service_type', function() {
			return {
				filters: {'module': "Service Type"}
			};
		});

		// cur_frm.set_df_property("custom_orig_description","max_height","5px")
		// cur_frm.refresh_field("custom_orig_description")
		// $('[data-fieldname="custom_orig_description"]').css({'height': '72px'})
		frm.set_query("custom_questionnaire_template", function() {
			return {
				filters: [
					["Questionnaires Template","service_type","=",frm.doc.custom_service_type]
				]
			};
		});

    }
		
});
