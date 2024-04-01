frappe.listview_settings['Patient'] = {
	add_fields: ["custom_patient_status"],
	get_indicator: function (doc) {
		if (doc.custom_patient_status == "Active") {
			return [__(doc.custom_patient_status), "green", "status,=," + doc.custom_patient_status];
		} else if (doc.custom_patient_status == "Inactive") {
			return [__(doc.custom_patient_status), "red", "status,=," + doc.custom_patient_status];
		} else if (doc.custom_patient_status === "Transferred") {
			return [__(doc.custom_patient_status), "yellow", "status,=," + doc.custom_patient_status];
		}
	}
};

frappe.listview_settings['Patient'].onload = function (listview) {
	listview.page.add_action_item(__("Create Opportunity"), function () {
		var selected_items = listview.get_checked_items();
		console.log(selected_items);

		var selected_names = []

		selected_items.forEach(data => {
			selected_names.push(data.name);
		});


		frappe.call({
			method: "pharm_ehr_tenant.api.create_bulk_opportunities",
			args: {
				doctype: "Patient",
				names: selected_names,
			}
		})
	});
};
