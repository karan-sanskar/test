frappe.listview_settings['Patient Appointment'] = {
	add_fields: ["status"],
	get_indicator: function (doc) {
		if (doc.status == "Open") {
			return [__("Draft"), "red", "status,=," + doc.status];
		} else if (doc.status == "Scheduled") {
			return [__(doc.status), "yellow", "status,=," + doc.status];
		} else if (doc.status === "Closed") {
			return [__(doc.status), "green", "status,=," + doc.status];
		}
	}
};