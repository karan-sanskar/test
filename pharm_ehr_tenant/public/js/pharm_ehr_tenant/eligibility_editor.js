frappe.EligibilityEditor = class {
    constructor(wrapper, frm, disable) {
        this.frm = frm;
        this.wrapper = wrapper;
        this.disable = disable;
        let conditions = this.frm.doc.eligibility ? this.frm.doc.eligibility.map((a) => a.criteria) : [];
        this.multicheck = frappe.ui.form.make_control({
            parent: wrapper,
            df: {
                fieldname: "eligibility",
                fieldtype: "MultiCheck",
                select_all: true,
                get_data: () => {
                    return frappe
                        .xcall("pharm_ehr_tenant.pharm_ehr_tenant.utils.get_all_eligibility_criteria",{
                            service_type:frm.doc.service_type,service_name:frm.doc.service_name
                        })
                        .then((criteria_list) => {
                            return criteria_list.map((eligibility) => {
                                return {
                                    label: __(eligibility),
                                    value: eligibility,
                                    checked: conditions.includes(eligibility),
                                };
                            });
                        });
                },
                on_change: () => {
                    this.set_diagnosis_in_table();
                    this.frm.dirty();
                },
            },
            render_input: true,
        });
        
        let original_func = this.multicheck.make_checkboxes;
        this.multicheck.make_checkboxes = () => {
            original_func.call(this.multicheck);
            this.multicheck.$wrapper.find(".label-area").click((e) => {
                let diagnosis = $(e.target).data("unit");
                // diagnosis && this.show_permissions(diagnosis);
                e.preventDefault();
            });
        };
    }
    set_enable_disable() {
        // this.multicheck.$wrapper
		// 	.find(".checkbox")
		// 	.css("width", "auto")
		// 	.css("max-width", "1200px");
        $(this.wrapper)
            .find('input[type="checkbox"]')
            .attr("disabled", this.disable ? true : false);

    }
    show() {
        this.reset();
        this.set_enable_disable();
    }

    reset() {
        let conditions = (this.frm.doc.eligibility || []).map((a) => a.criteria);
        this.multicheck.selected_options = conditions;
        this.multicheck.refresh_input();
    }
    set_diagnosis_in_table() {
        let current_conditions = this.frm.doc.eligibility || [];
        let checked_options = this.multicheck.get_checked_options();
        current_conditions.map((diagnosis_doc) => {
            if (!checked_options.includes(diagnosis_doc.criteria)) {
                frappe.model.clear_doc(diagnosis_doc.doctype, diagnosis_doc.name);
            }
        });
        checked_options.map((diagnosis) => {
            if (!current_conditions.find((d) => d.criteria === diagnosis)) {
                let diagnosis_doc = frappe.model.add_child(this.frm.doc, "Eligibility Check for CMR", "eligibility");
                diagnosis_doc.criteria = diagnosis;
            }
        });
    }
    get_conditions() {
        return {
            checked_roles: this.multicheck.get_checked_options(),
            unchecked_roles: this.multicheck.get_unchecked_options(),
        };
    }
}
