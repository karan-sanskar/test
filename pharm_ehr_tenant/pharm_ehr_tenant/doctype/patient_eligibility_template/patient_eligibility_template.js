// Copyright (c) 2024, Aerele and contributors
// For license information, please see license.txt

frappe.ui.form.on("Patient Eligibility Template", {
	refresh(frm) {
        frm.set_query("service_type", function (doc) {
            return {
                filters: {
                    module:"Service Type"
                }
            };
        });
	},
});
