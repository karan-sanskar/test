frappe.provide('frappe.ui.form');

frappe.DiagnosisEditor = class {
	constructor(wrapper, frm, disable) {
		this.frm = frm;
		this.wrapper = wrapper;
		this.disable = disable;
		let conditions = this.frm.doc.current_conditions ? this.frm.doc.current_conditions.map((a) => a.diagnosis) : [];
		this.multicheck = frappe.ui.form.make_control({
			parent: wrapper,
			df: {
				fieldname: "current_conditions",
				fieldtype: "MultiCheck",
				select_all: true,
				columns: "15rem",
				get_data: () => {
					return frappe
						.xcall("pharm_ehr_tenant.pharm_ehr_tenant.utils.get_all_diagnosis")
						.then((current_conditions) => {
							return current_conditions.map((diagnosis) => {
								return {
									label: __(diagnosis),
									value: diagnosis,
									checked: conditions.includes(diagnosis),
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
		$(this.wrapper)
			.find('input[type="checkbox"]')
			.attr("disabled", this.disable ? true : false);
	}
	// show_permissions(diagnosis) {
	//     // show permissions for a diagnosis
	//     if (!this.perm_dialog) {
	//         this.make_perm_dialog();
	//     }
	//     $(this.perm_dialog.body).empty();
	//     return frappe
	//         .xcall("frappe.core.doctype.user.user.get_perm_info", { diagnosis })
	//         .then((permissions) => {
	//             const $body = $(this.perm_dialog.body);
	//             if (!permissions.length) {
	//                 $body.append(`<div class="text-muted text-center padding">
	//                     ${__("{0} diagnosis does not have permission on any doctype", [__(diagnosis)])}
	//                 </div>`);
	//             } else {
	//                 $body.append(`
	//                     <table class="user-perm">
	//                         <thead>
	//                             <tr>
	//                                 <th> ${__("Document Type")} </th>
	//                                 <th> ${__("Level")} </th>
	//                                 ${frappe.perm.rights.map((p) => `<th> ${__(frappe.unscrub(p))}</th>`).join("")}
	//                             </tr>
	//                         </thead>
	//                         <tbody></tbody>
	//                     </table>
	//                 `);
	//                 permissions.forEach((perm) => {
	//                     $body.find("tbody").append(`
	//                         <tr>
	//                             <td>${__(perm.parent)}</td>
	//                             <td>${perm.permlevel}</td>
	//                             ${frappe.perm.rights
	//                                 .map(
	//                                     (p) =>
	//                                         `<td class="text-muted bold">${
	//                                             perm[p] ? frappe.utils.icon("check", "xs") : "-"
	//                                         }</td>`
	//                                 )
	//                                 .join("")}
	//                         </tr>
	//                     `);
	//                 });
	//             }
	//             this.perm_dialog.set_title(__(diagnosis));
	//             this.perm_dialog.show();
	//         });
	// }
	// make_perm_dialog() {
	//     this.perm_dialog = new frappe.ui.Dialog({
	//         title: __("Diagnosis Permissions"),
	//     });

	//     this.perm_dialog.$wrapper
	//         .find(".modal-dialog")
	//         .css("width", "auto")
	//         .css("max-width", "1200px");

	//     this.perm_dialog.$wrapper.find(".modal-body").css("overflow", "overlay");
	// }
	show() {
		this.reset();
		this.set_enable_disable();
	}

	reset() {
		let conditions = (this.frm.doc.current_conditions || []).map((a) => a.diagnosis);
		this.multicheck.selected_options = conditions;
		this.multicheck.refresh_input();
	}
	set_diagnosis_in_table() {
		let current_conditions = this.frm.doc.current_conditions || [];
		let checked_options = this.multicheck.get_checked_options();
		current_conditions.map((diagnosis_doc) => {
			if (!checked_options.includes(diagnosis_doc.diagnosis)) {
				frappe.model.clear_doc(diagnosis_doc.doctype, diagnosis_doc.name);
			}
		});
		checked_options.map((diagnosis) => {
			if (!current_conditions.find((d) => d.diagnosis === diagnosis)) {
				let diagnosis_doc = frappe.model.add_child(this.frm.doc, "Has Diagnosis", "current_conditions");
				diagnosis_doc.diagnosis = diagnosis;
			}
		});
	}
	get_conditions() {
		return {
			checked_roles: this.multicheck.get_checked_options(),
			unchecked_roles: this.multicheck.get_unchecked_options(),
		};
	}
};
	