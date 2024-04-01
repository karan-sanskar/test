	// Copyright (c) 2024, Aerele and contributors
// For license information, please see license.txt

frappe.provide("erpnext");

erpnext.CMRServiceController = class CMRServiceController extends frappe.ui.form.Controller {
	refresh (frm) {
		this.show_appointment();
		frappe.call({
			method: "pharm_ehr_tenant.pharm_ehr_tenant.utils.get_docdata_for_select",
			args: {
				doctype:cur_frm.doc.doctype
			},
			callback: function(r){
				if(r.message.length){
					if(r.message[0].length){
						var default_template = ""
						for(let i of r.message[0]){
							if(i.make_this_default){
								default_template = i.name
								break
							}
						}
						cur_frm.set_df_property("patient_eligibility_template","options",r.message[0].map((d)=>d.name).join("\n"))
						cur_frm.set_value("patient_eligibility_template",default_template)
						
					}
					if(r.message[1].length){
						cur_frm.set_df_property("custom_location_of_service","options",r.message[1].join("\n"))
						if(r.message[1].length == 1){
							cur_frm.set_value("custom_location_of_service",r.message[1][0])
						}

					}
					if(r.message[2].length){
						cur_frm.set_df_property("custom_select_appointment_type","options",r.message[2].join("\n"))
						cur_frm.set_value("custom_select_appointment_type","New CMR Service")
						
					}
					cur_frm.refresh_fields()
				}




			}
		});

	}

	show_appointment() {
		const patient_appointment = new erpnext.utils.PatientAppointment({
			frm: this.frm,
			check_and_set_availability,
			open_appointments: $(this.frm.fields_dict.appointment_html.wrapper)
		});
		patient_appointment.refresh();
	}
};


extend_cscript(cur_frm.cscript, new erpnext.CMRServiceController({ frm: cur_frm }));

frappe.ui.form.on("CMR Service", {
	book_an_appointment: function(frm){
		frappe.call({
			method: "frappe.client.get_value",
			args: {
				doctype: "Appointment Type",
				filters: {"custom_default_followup": 1},
				fieldname: "name"
			},
			callback: function(r){
				if(r.message){
					check_and_set_availability(frm, r.message.name)
				}
				else{
					frappe.throw("No Default follow up Appointment Type found")
				}
			}
		})

	},

	phone1(frm) {
		frappe.db.get_value("Company", frappe.defaults.get_global_default("company"), "custom_mobile_number_format", (r) => {
			let phoneNumber = frm.doc.phone;
			let format = r.custom_mobile_number_format
			let formatIndexes = format.split("-");
			let numericPhoneNumber = phoneNumber.replace(/\D/g, '');

			let formatDig = format.replace(/-/g, "");


			if (formatDig.length !== numericPhoneNumber.length && numericPhoneNumber.length > formatDig.length-1) {
				frappe.throw(`Invalid Phone Number Format: ${format}`);
			}

			let cIndex = formatIndexes[0].length;
			let countryCode = numericPhoneNumber.substring(0, cIndex);
			let formattedPhoneNumber = countryCode;

			for (let i = 1; i < formatIndexes.length; i++) {
				formattedPhoneNumber += "-" + numericPhoneNumber.substring(cIndex, cIndex + formatIndexes[i].length);
				cIndex += formatIndexes[i].length;
			}

			// return formattedPhoneNumber;
			frm.set_value("phone", formattedPhoneNumber)
			})
		},

	patient_name:function(frm){
		if(frm.doc.patient_name){
			frappe.call({
				method: "frappe.client.get_list",
				args: {
					doctype: 'Common Conditions',
					filters: [
						["parent","=", frm.doc.patient_name]
					],
					fields: ["health_condition","condition_status"],
					parent: "Patient",
					order_by: "idx"
				}
			}).then((r) => {
				if(r.message){
					frm.clear_table("health_conditions")
					for(let row of r.message){
						var child = frm.add_child("health_conditions")
						child.health_condition = row.health_condition,
						child.condition_status = row.condition_status
					}
					frm.refresh_field("health_conditions")
				}
			})
			frappe.call({
				method: "frappe.client.get_list",
				args: {
					doctype: 'Drug Allergies Side Effects',
					filters: [
						["parent","=", frm.doc.patient_name]
					],
					fields: ["allergies","reaction"],
					parent: "Patient",
					order_by: "idx"
				}
			}).then((r) => {
				if(r.message){
					frm.clear_table("allergies_side_effects")
					for(let row of r.message){
						var child = frm.add_child("allergies_side_effects")
						child.allergies = row.allergies,
						child.reaction = row.reaction
					}
					frm.refresh_field("allergies_side_effects")
				}
			})
			frappe.call({
				method: "frappe.client.get_list",
				args: {
					doctype: 'CMR Medications',
					filters: [
						["parent","=", frm.doc.patient_name]
					],
					fields: ["medication_name","prescriber","directions","related_conditions","potential_problem"],
					parent: "Patient",
					order_by: "idx"
				}
			}).then((r) => {
				if(r.message){
					frm.clear_table("medications")
					for(let row of r.message){
						var child = frm.add_child("medications")
						child.medication_name = row.medication_name,
						child.prescriber = row.prescriber,
						child.directions = row.directions,
						child.related_conditions = row.related_conditions,
						child.potential_problem = row.potential_problem
					}
					frm.refresh_field("medications")

					frm.clear_table("medication_action_plan")
					for(let row of r.message){
						var child = frm.add_child("medication_action_plan")
						child.medication = row.medication_name
					}
					frm.refresh_field("medication_action_plan")
				}

			})
			const fields = [
				"custom_do_you_currently_use_or_have_you_ever_tobacco_profucts",
				"custom_current_cigarette_smoker",
				"custom_when_did_you_first_start_smoking",
				"custom_how_many_cigarettes_do_you_smoke_per_day",
				"custom_are_you_interested_in_quiting_1",
				"custom_former_cigarette_smoker",
				"custom_when_did_you_quit_smoking",
				"custom_on_average_how_many_cigarettes_did_you_smoke_per_day",
				"custom_how_many_years_did_you_smoke_for",
				"custom_other_tobacco_user",
				"custom_other_description",
				"custom_how_many_times_in_the_past_year",
				"custom_are_you_interested_in_quiting_2",
				"custom_past_year_have_you_had_4_or_more_alcoholic_drinks_iady",
				"custom_use_opioids_and_have_access_to_nacran",
				"custom_are_you_interesting_in_quiting",
				"custom_purpose_of_body_shapping",
				"custom_have_you_hospitalized_overnight",
				"custom_what_for_and_when"
			]
			frappe.call({
				method: "frappe.client.get_list",
				args: {
					doctype: 'Patient',
					filters: [
						["name","=", frm.doc.patient_name]
					],
					fields: fields
				},
				async:false
			}).then((r) => {
				if(r.message[0]){
					Object.entries(r.message[0]).forEach(([key, value]) => {
						cur_frm.set_value(key.replace("custom_", ""), value)
					});
				}
			})
			const tab_fields = [
				"recreational_drug_usage",
				"relative_medical_conditions",
				"surgical_histories",
				"employment_housing_transportation"
			]
			tab_fields.forEach((tab)=>{
				frappe.call({
					method: "pharm_ehr_tenant.pharm_ehr_tenant.utils.get_child_table_values",
					args: {
						doctype: "Patient", docname: frm.doc.patient_name, table_name: "custom_"+tab
					}
				}).then((r) => {
					if(r.message){
						frm.clear_table(tab)
						for(let row of r.message){
							frm.add_child(tab, row)
						}
						frm.refresh_field(tab)
					}
				})
			})

		frm.trigger("get_patient_address")
		}
	},

	get_medications: function(frm){
		let medications = cur_frm.doc.medications.map(element => {return element.medication_name})

		frm.clear_table("medication_action_plan")
		medications.forEach(medication => {
			var child = frm.add_child("medication_action_plan")
			child.medication = medication
		});
		frm.refresh_field("medication_action_plan")
	},

	get_patient_address: function(frm){
		frappe.call({
			doc: frm.doc,
			method: "get_patient_address",
			async: false,
		}).then((r)=>{
			if(r.message.address){
				frm.set_value("patient_address", r.message.address)
			}
			else{
				frm.set_value("patient_address", "")
				frm.refresh_field("patient_address")
			}
		})
	},

	patient_eligibility_template: function(frm){
			cur_frm.remove_custom_button("Check for Eligibility")
			if(frm.doc.patient_eligibility_template){
				frm.trigger("show_eligibility_template")
			}
			else{
				var wrapper = frm.get_field("eligibility_criteria_html").$wrapper;
				wrapper.html("")
			}

	},

	setup:function(frm){
		frm.set_query("patient_address", function() {
			return {
				filters: [
					["Dynamic Link","link_doctype", "=", "Patient"],
					["Dynamic Link","link_name", "=", frm.doc.patient_name]
				]
			};
		});


		// frm.set_query("patient_name", function (frm) {
		// 	return {
		// 		query: "pharm_ehr_tenant.pharm_ehr_tenant.utils.get_patient",
		// 	};
		// });
	},

	patient_address: function(frm){
		if(frm.doc.patient_address){
			frappe.call({
				method: 'frappe.contacts.doctype.address.address.get_address_display',
				args: {
					"address_dict": frm.doc.patient_address
				},
				callback: function(r) {
					frm.set_value("address_html", r.message);
				}
			});
		}
		if(!frm.doc.patient_address){
			frm.set_value("address_html", "");
		}
	},

	cmr_recipient_address: function(frm){
		if(frm.doc.cmr_recipient_address){
			frappe.call({
				method: 'frappe.contacts.doctype.address.address.get_address_display',
				args: {
					"address_dict": frm.doc.cmr_recipient_address
				},
				callback: function(r) {
					frm.set_value("address", r.message);
				}
			});
		}
		if(!frm.doc.cmr_recipient_address){
			frm.set_value("address", "");
		}
	},

	before_save:function(frm){
		if(frm.doc.patient_eligibility_template){
			frm.trigger("set_table_values")
		}
	 },

	 set_table_values:function(frm){
		setTimeout(() => {
			for(let row of cur_frm.doc.eligibility){
				let ele = $(`input[id="elig_${row.criteria.split(".")[0]}"]`)
				if(ele.hasOwnProperty(0)){
					ele[0].checked = true;
				}

			}
		}, 100);
	},

	after_save: (frm)=>{
		cur_frm.reload_doc()
		cur_frm.debounced_reload_doc()
	},

	payment_type: function(frm){
		if(frm.doc.payment_type != "Insurance"){
			frm.set_value("billing_code", [])
		}
	},

	onload_post_render:function(frm) {
		if(cur_frm.doc.__islocal){
			cur_frm.clear_table('medications')
			cur_frm.clear_table('medication_action_plan')

		}

		// if(frm.is_dirty()){
		// 	frm.trigger("save_form")
		// }

		if(cur_frm.doc.workflow_state == "Not Started"){
			setTimeout(()=>{
				$(`[data-label="Save"]`).remove()
			}, 60)
		}

		frm.trigger("select_tab")

		// frappe.db.get_value("Company", frappe.defaults.get_global_default("company"), "custom_mobile_number_format", (r) => {
		// 	if(r.custom_mobile_number_format){
		// 		frm.set_df_property("phone", "description", "<b>Format for phone number: "+r.custom_mobile_number_format+"</b>")
		// 	}
		// })

		// frappe.db.get_value("Company", frappe.defaults.get_global_default("company"), "custom_mobile_number_format", (r) => {
		// 	if(r.custom_mobile_number_format){
		// 		frm.set_df_property("pcp_phone_number", "description", "<b>Format for phone number: "+r.custom_mobile_number_format+"</b>")
		// 	}
		// })

		toggleButtonActions(frm)

		$(document).ready(function() {
			frm.doc.recreational_drug_usage.forEach(row => {
				if(row.last_use){
					$(`[id= "${"select_"+row.drug_name.replace(/\s/g, '_')}]"`).value = `${row.last_use}`
				}
			});
		})

		// if(frm.doc.__unsaved){
		//     frappe.call({
		//         method: "pharm_ehr_tenant.service_type.doctype.cmr_service.cmr_service.get_default_medications",
		//         args: {
		//             doctype:frm.doc.doctype
		//         },
		//         callback:function(r){
		//             if(r.message){
		//                 frm.clear_table("medications")
		//                 for(let data of r.message){
		//                     var row = frm.add_child("medications")
		//                     row.medication_name = data["parent"]
		//                 }
		//                 frm.refresh_field("medications")
		//             }
		//         }
		//     })
		// }
		// cur_frm.dashboard.clear_comment()
		// if(frm.doc.workflow_state == "Not Started" && (!cur_frm.doc.__islocal)){
		// 	cur_frm.dashboard.clear_comment()
		// 	let msg = "Select Service Provider form first and Verify eligibility before proceeding to the next stage."
		// 	frm.dashboard.add_comment(msg, "blue", true);
		// }

		if(!frm.doc.payment_type){
			frm.set_value("payment_type", "Insurance")
		}
		if(frm.doc.patient_appointment){
			cur_frm.add_custom_button(__("Appointment"), function () {
				frappe.set_route("Form","Patient Appointment",frm.doc.patient_appointment)
			},"View")
		}

	},
	aggree: function(frm){
		if(frm.doc.aggree == "No"){
			frm.set_value("delivery_method", "Face to Face")
			frm.set_value("mode_of_delivering_mtm", 0)
			frm.set_value("aggree", "")

		}
	},

	show_progress: function(frm) {
		let bars = [];
		let message = '';

		var condition = JSON.parse(cur_frm.doc.workflow_progress)

		let title = __('{0}', [frm.doc.workflow_state]);

		bars.push({
			'title': title,
			'width': (condition[cur_frm.doc.workflow_state] / condition["Service Completed"] * 100) + '%',
			'progress_class': frm.doc.workflow_state != "Ineligible" ? 'progress-bar-success' :  'progress-bar-warning'
		});
		if (bars[0].width == '0%') {
			bars[0].width = '0.5%';
		}
		message = title;
		frm.dashboard.hide_progress()
		frm.dashboard.add_progress(__('Worrkflow Status'), bars, message);
	},


	show_eligibility_template: function(frm){
		frappe.call({
			method: "pharm_ehr_tenant.pharm_ehr_tenant.utils.get_all_eligibility_criteria",
			args: {
				template:frm.doc.patient_eligibility_template || null
			},
			async:false,
			callback: function(r) {
				if(r.message) {

					var wrapper = frm.get_field("eligibility_criteria_html").$wrapper;
					wrapper.html("")

					var vaccine_html = `<div id="eligibility_criteria_html">
					<table style="width: 100%; border-collapse: collapse;">
										<tbody>`
						Object.keys(r.message).forEach(key => {
							vaccine_html += `<tr>
							<td style="width:5%;padding: 8px; text-align: left; top:0; left:0 "><input id=${"elig_"+(parseInt(key)+1)} type="checkbox" name="eligibility"></td>
								<td style="width:95%;padding: 8px; text-align: left; "> ${r.message[key]}</td>

							</tr>`
						})


					vaccine_html +=  `</tbody></table></div>`
					wrapper.html(vaccine_html)
					document.getElementById("eligibility_criteria_html").removeEventListener('change',function(){})
					document.getElementById("eligibility_criteria_html").addEventListener('change', function(event) {
						if (event.target.type === 'checkbox' && event.target.name === 'eligibility') {
							frm.dirty()

							handleCheckboxChange(event.target,frm);
						}
					});

				}
			}
		});

		setTimeout(() => {
			for(let row of cur_frm.doc.eligibility){
				let ele = $(`input[id="elig_${row.criteria.split("_")[1]}"]`)
				if(ele.hasOwnProperty(0)){
					ele[0].checked = true;
				}

			}
		}, 300);
	},

	refresh: function (frm) {
		frm.set_df_property('custom_location_of_service', 'only_select', true);
		frm.set_df_property('custom_select_appointment_type', 'only_select', true);
		if(frm.doc.patient_appointment){
			cur_frm.add_custom_button(__("Appointment"), function () {
				frappe.set_route("Form","Patient Appointment",frm.doc.patient_appointment)
			},"View")
		}
		let bmi_note = null;
		try {
			var bmi = frm.doc.bmi;

		} catch (error) {
			bmi = 0
		}

		if (bmi<18.5) {
			bmi_note = __('Underweight');
		} else if (bmi>=18.5 && bmi<25) {
			bmi_note = __('Normal');
		} else if (bmi>=25 && bmi<30) {
			bmi_note = __('Overweight');
		} else if (bmi>=30) {
			bmi_note = __('Obese');
		}
		// cur_frm.set_df_property("bmi", "description" ,  bmi_note)

		// auto_save(frm)

		cur_frm.dashboard.progress_area.body.prependTo($(`[class="form-tabs-list"]`))

		// setTimeout(() => {
		// 	if(!frm.doc.__islocal && $(`.bhavan`).length < 1){
		// 		$(`[class="menu-btn-group"]`).addClass("bhavan").appendTo($(`[class="flex col page-actions justify-content-end"]`))
		// 	}
		// 	toggleButtonActions(frm)
		// }, 100);

		$('[class="btn-open-row"]').hide()



		if(!frm.doc.__islocal && frm.doc.patient_eligibility_template){
			frm.trigger("show_eligibility_template")
		}
		else{
			var wrapper = frm.get_field("eligibility_criteria_html").$wrapper;
			wrapper.html("")
		}

		if(cur_frm.doc.workflow_state == "Not Started"){
		 	setTimeout(()=>{
		 		$(`[data-label="Save"]`).remove()
		 	}, 60)
		 }

		frm.trigger("add_wokflow_button")

		renderHtmlSection(frm)

		frm.trigger("toggle_button_add_row")

		if(!frm.doc.__islocal){
			frm.trigger('show_progress');
		}

		frm.set_query("patient_eligibility_template", function (frm) {
			return {
				filters: {
					service_type:cur_frm.doc.doctype
				}
			};
		});

		frm.set_query("item_code", "billing_code", function (frm) {
			return {
				// query: "pharm_ehr_tenant.pharm_ehr_tenant.utils.get_item",
				filters:
					{
						"custom_service_type":"CMR Service",
						// "duration": cur_frm.doc.total_duration
					}
			};
		});
		frm.set_query("custom_select_appointment_type", function (frm) {
			return {
				query: "pharm_ehr_tenant.pharm_ehr_tenant.utils.get_appointment_type_for_service",
				filters:
					{
						"custom_service_type":"CMR Service",
						// "duration": cur_frm.doc.total_duration
					}
			};
		});

		// frappe.call({
		// 	method: "frappe.client.get_list",
		// 	args: {
		// 		doctype: 'Healthcare Service Unit',
		// 		filters: [
		// 			["is_group","=", 0]
		// 		],
		// 		fields: ["name"]
		// 	}
		// }).then((r) => {
		// 	if(r.message){
		// 		if(r.message.length == 1){
		// 			frm.set_value("custom_location_of_service",r.message[0]["name"])
		// 		}
		// 		frm.refresh_field("custom_location_of_service")
		// 	}})

		// if(!frm.doc.__unsaved){
		//     frappe.call(
		// 			{
		// 				method: "frappe.client.get_value",
		// 				args: {
		// 					doctype: "Eligibility Form",
		// 					fieldname: "name",
		// 					filters:{
		// 						"service_type": "CMR Service",
		// 						"service_name": frm.doc.name
		// 					},
		// 				},
		// 				callback: (res)=>{
		// 					if(res.message.name){
		// 						get_eligibility_criteira(frm)
		// 					}
		// 				},
		// 				async:false
		// 			}
		// 		)
		//     }

		// if(!frm.doc.__unsaved){
		// 	if (["Not Started", "Ineligible"].includes(cur_frm.doc.workflow_state)){
		// 		frm.add_custom_button(__('Check for Eligibility'), function(){
		// 			if(!cur_frm.doc.patient_eligibility_template){
		// 				frappe.throw({message: "Select Patient Eligibility Template to check", title:"Mandatory value"})
		// 			}
		// 			frappe.call(
		// 				{
		// 					method: "frappe.client.get_value",
		// 					args: {
		// 						doctype: "Eligibility Form",
		// 						fieldname: "name",
		// 						filters:{
		// 							"service_type": "CMR Service",
		// 							"service_name": frm.doc.name
		// 						},
		// 					},
		// 					callback: (res)=>{
		// 						if(res.message.name){
		// 							frappe.set_route("Form", "Eligibility Form", res.message.name)
		// 						}
		// 						else{
		// 							frappe.new_doc("Eligibility Form",{"service_type":cur_frm.doc.doctype,"service_name":cur_frm.doc.name})
		// 						}
		// 					},
		// 					async:false
		// 				}
		// 			)
		// 		}
		// 	);
		// 	}
		// }


		// frappe.db.get_value("Sales Invoice",
		//     {
		//         "custom_service_type": cur_frm.doc.doctype,
		//         "custom_service_name": cur_frm.doc.name
		//     },
		//     "name").
		//     then(
		//         (r) => {
		//             if (frm.doc.workflow_state == "Service Completed" && !r.message.name){
		//                 frm.add_custom_button(
		//                     __("Create Invoice"),
		//                     function () {
		//                         frm.trigger("createInvoice");
		//                     }
		//                 );
		//             }
		//         })
	},
	toggle_button_add_row: function(frm){
		$("[data-fieldname='health_conditions']").find(".btn.btn-xs.btn-secondary.grid-add-row")[0].textContent = "Add a health condition"
		$("[data-fieldname='allergies_side_effects']").find(".btn.btn-xs.btn-secondary.grid-add-row")[0].textContent = "Add a drug allergy"
		$("[data-fieldname='medications']").find(".btn.btn-xs.btn-secondary.grid-add-row")[0].textContent = "Add a medication"

		$("[data-fieldname='recreational_drug_usage']").find(".btn.btn-xs.btn-secondary.grid-add-row")[0].textContent = "Add a drug & Last Use"
		$("[data-fieldname='relative_medical_conditions']").find(".btn.btn-xs.btn-secondary.grid-add-row")[0].textContent = "Add a medical condition & relatives"
		$("[data-fieldname='surgical_histories']").find(".btn.btn-xs.btn-secondary.grid-add-row")[0].textContent = "Add a surgical history"
		$("[data-fieldname='employment_housing_transportation']").find(".btn.btn-xs.btn-secondary.grid-add-row")[0].textContent = "Add an employment, housing, & transportation"
		$("[data-fieldname='medication_action_plan']").find(".btn.btn-xs.btn-secondary.grid-add-row")[0].textContent = "Add a medication action plan"
		$("[data-fieldname='billing_code']").find(".btn.btn-xs.btn-secondary.grid-add-row")[0].textContent = "Add a billing code"
	},
	save_form(frm){
		if(!frm.doc.__islocal){
			frappe.run_serially([
				()=> frappe.dom.freeze(),
				()=> frm.dirty(),
				()=> frm.save(),
				()=> frappe.dom.unfreeze()]
			)
		}

	},

	add_wokflow_button(frm){
		if(cur_frm.doc.__islocal){
			cur_frm.add_custom_button(__("Next: Eligibility Criteria"), function () {
				// set the workflow_action for use in form scripts
				frappe.run_serially([
					()=> frm.save(),
					()=> {
						frappe.call({
							method: "pharm_ehr_tenant.pharm_ehr_tenant.utils.create_patient_appointment",
							args: {
								doc:frm.doc
							},
							callback: (res)=>{

							}
						})
					}
				])

			}).addClass('btn btn-primary');
		}

		if(cur_frm.doc.workflow_state== "Not Started" && !cur_frm.doc.__islocal){
			cur_frm.add_custom_button(__("Next: Patient History"), function () {
				frappe.run_serially([
					()=> frm.dirty(),
					()=> frm.save(),
					()=> frappe.dom.freeze(),
					()=> frappe.dom.unfreeze()

					
					// ()=> window.location.reload()
				])
			}).addClass('btn btn-primary');
		}

		if(cur_frm.doc.workflow_state== "Qualified"){
			cur_frm.add_custom_button(__("Next: Scheduling"), function () {
				frappe.run_serially([
					()=> frm.dirty(),
					()=> frm.save(),
					()=> {frappe.dom.freeze();
					frm.selected_workflow_action = "";
					cur_frm.script_manager.trigger("before_workflow_action").then(() => {
						frappe
							.xcall("frappe.model.workflow.apply_workflow", {
								doc: frm.doc,
								action: "In Progress",
							})
							.then((doc) => {
								frappe.model.sync(doc);
								cur_frm.refresh();
								cur_frm.selected_workflow_action = null;
								cur_frm.script_manager.trigger("after_workflow_action");
							})
							.finally(() => {
								frappe.dom.unfreeze();
							});
					});}
				])

			}).addClass('btn btn-primary');
		}

		if(cur_frm.doc.workflow_state== "In Progress"){
			cur_frm.add_custom_button(__("Next: Action Plan"), function () {
				// set the workflow_action for use in form scripts
				frappe.run_serially([
					()=> frm.dirty(),
					()=> frm.save(),
					()=> {
						frappe.dom.freeze();
						frm.selected_workflow_action = "";
						cur_frm.script_manager.trigger("before_workflow_action").then(() => {
							frappe
								.xcall("frappe.model.workflow.apply_workflow", {
									doc: frm.doc,
									action: "Schedule",
								})
								.then((doc) => {
									frappe.model.sync(doc);
									cur_frm.refresh();
									cur_frm.selected_workflow_action = null;
									cur_frm.script_manager.trigger("after_workflow_action");
								})
								.finally(() => {
									frappe.dom.unfreeze();
								});
						});
					}])

			}).addClass('btn btn-primary');
		}

		// if(cur_frm.doc.workflow_state== "Scheduled"){
		// 	cur_frm.add_custom_button(__("Next: Ready for Review"), function () {
		// 		// set the workflow_action for use in form scripts
		// 		frappe.dom.freeze();
		// 		frm.selected_workflow_action = "";
		// 		cur_frm.script_manager.trigger("before_workflow_action").then(() => {
		// 			frappe
		// 				.xcall("frappe.model.workflow.apply_workflow", {
		// 					doc: frm.doc,
		// 					action: "Ready for review",
		// 				})
		// 				.then((doc) => {
		// 					frappe.model.sync(doc);
		// 					cur_frm.refresh();
		// 					cur_frm.selected_workflow_action = null;
		// 					cur_frm.script_manager.trigger("after_workflow_action");
		// 				})
		// 				.finally(() => {
		// 					frappe.dom.unfreeze();
		// 				});
		// 		});
		// 	}).addClass('btn btn-primary');
		// }

		if(cur_frm.doc.workflow_state== "Scheduled"){
			cur_frm.add_custom_button(__("Next: Patient Summary"), function () {
				// set the workflow_action for use in form scripts
				frappe.run_serially([
					()=> frm.dirty(),
					()=> frm.save(),
					()=> {
						frappe.dom.freeze();
						frm.selected_workflow_action = "";
						cur_frm.script_manager.trigger("before_workflow_action").then(() => {
							frappe
								.xcall("frappe.model.workflow.apply_workflow", {
									doc: frm.doc,
									action: "Ready for service",
								})
								.then((doc) => {
									frappe.model.sync(doc);
									cur_frm.refresh();
									cur_frm.selected_workflow_action = null;
									cur_frm.script_manager.trigger("after_workflow_action");
								})
								.finally(() => {
									frappe.dom.unfreeze();
								});
						});
					},
					()=> {
						frm.save()
					}
				])

			}).addClass('btn btn-primary');
		}

		if(cur_frm.doc.workflow_state== "Ready for Service"){
			cur_frm.add_custom_button(__("Complete"), function () {
				// set the workflow_action for use in form scripts
				frappe.run_serially([
					()=> frm.dirty(),
					()=> frm.save(),
					()=> {
						// frappe.dom.freeze();
						frm.selected_workflow_action = "";
						cur_frm.script_manager.trigger("before_workflow_action").then(() => {
							frappe
								.xcall("frappe.model.workflow.apply_workflow", {
									doc: frm.doc,
									action: "Complete",
								})
								.then((doc) => {
									frappe.model.sync(doc);
									cur_frm.refresh();
									cur_frm.selected_workflow_action = null;
									cur_frm.script_manager.trigger("after_workflow_action");
								})
								.finally(() => {
									// frappe.dom.unfreeze();
								});
						});
					}])

			}).addClass('btn btn-primary');
		}

		if (frm.doc.workflow_state == "Service Completed"){
			frm.add_custom_button(
				__("Follow-up Appointment"),function () {
					frm.trigger("book_an_appointment")
				}
			).addClass('btn btn-primary');
		}

		if(cur_frm.doc.workflow_state== "Service Completed"){
			cur_frm.add_custom_button(__("Patient Take Away"), function () {
				frappe.run_serially([
					()=> frm.dirty(),
					()=> frm.save(),
					()=> {
						// frappe.set_route("print", cur_frm.doc.doctype, cur_frm.doc.name);
						frappe.call({
							method: "pharm_ehr_tenant.pharm_ehr_tenant.utils.attach_pdf",
							args: {
								'doc_name': frm.doc.name,
								'doc_type': frm.doc.doctype,
								"language": frm.doc.language
							},
							callback: (res)=>{
								if(res.message){
									window.open(res.message)
									cur_frm.reload_doc()
								}
								else{
									frappe.msgprint("Attachment failed")
								}
							}
						})
					}]);
				}).addClass('btn btn-primary');
				// frm.disable_form()
		}
		if(cur_frm.doc.workflow_state== "Service Completed"){
			cur_frm.page.add_menu_item("Cancel", ()=> {
				frappe.dom.freeze();
				frm.selected_workflow_action = "";
				cur_frm.script_manager.trigger("before_workflow_action").then(() => {
					frappe
						.xcall("frappe.model.workflow.apply_workflow", {
							doc: frm.doc,
							action: "Cancel",
						})
						.then((doc) => {
							frappe.model.sync(doc);
							cur_frm.refresh();
							cur_frm.selected_workflow_action = null;
							cur_frm.script_manager.trigger("after_workflow_action");
						})
						.finally(() => {
							frappe.dom.unfreeze();
						});
				});
			})
		}

		// if(cur_frm.doc.workflow_state== "Pending Service Delivery"){
		// 	cur_frm.add_custom_button(__("Complete"), function () {
		// 		// set the workflow_action for use in form scripts
		// 		frappe.dom.freeze();
		// 		frm.selected_workflow_action = "";
		// 		cur_frm.script_manager.trigger("before_workflow_action").then(() => {
		// 			frappe
		// 				.xcall("frappe.model.workflow.apply_workflow", {
		// 					doc: frm.doc,
		// 					action: "Complete",
		// 				})
		// 				.then((doc) => {
		// 					frappe.model.sync(doc);
		// 					cur_frm.refresh();
		// 					cur_frm.selected_workflow_action = null;
		// 					cur_frm.script_manager.trigger("after_workflow_action");
		// 				})
		// 				.finally(() => {
		// 					frappe.dom.unfreeze();
		// 				});
		// 		});
		// 	}).addClass('btn btn-primary');
		// }
	},
	// createInvoice(frm){
	//     var d = new frappe.ui.Dialog({
	// 		title: __("Create Invoice"),
	// 		fields: [
	// 			{
	// 				label: "Item Name",
	// 				fieldname: "item",
	// 				fieldtype: "Link",
	//                 options:"Item",
	// 				reqd: 1,
	//                 get_query: function(){
	//                     return {
	//                         filters: {
	//                             "custom_duration": ["<=", Math.ceil(frm.doc.total_duration/15) * 15]
	//                         }
	//                     }
	//                 },
	// 			},
	// 		],
	// 		primary_action: function () {
	// 			var data = d.get_values();

	//             if (!cur_frm.doc.cmr_completed){
	//                 frappe.throw("CMR Completed date is mandatory")
	//             }

	// 			frappe.call({
	// 				method: "pharm_ehr_tenant.pharm_ehr_tenant.utils.create_sales_invoice",
	// 				args: {
	// 					doc: frm.doc,
	// 					item: data.item,
	// 				},
	// 				callback: function (r) {
	// 					if (!r.exc) {
	// 						if (r.message) {
	// 							frappe.set_route("Form", "Sales Invoice", r.message.name);
	// 						}
	// 						d.hide();
	// 					}
	// 				},
	// 			});
	// 		},
	// 		primary_action_label: __("Create"),
	// 	});
	// 	d.show();
	// },

	// validate: function (frm) {
	// 	if (frm.diagnosis_editor) {
	// 		frm.diagnosis_editor.set_diagnosis_in_table();
	// 	}
	// },
	height: function(frm) {
		if (frm.doc.height && frm.doc.weight) {
			calculate_bmi(frm);
		}
	},

	weight: function(frm) {
		if (frm.doc.height && frm.doc.weight) {
			calculate_bmi(frm);
		}
	},

	bp_systolic: function(frm) {
		if (frm.doc.bp_systolic && frm.doc.bp_diastolic) {
			set_bp(frm);
		}
	},

	bp_diastolic: function(frm) {
		if (frm.doc.bp_systolic && frm.doc.bp_diastolic) {
			set_bp(frm);
		}
	},

	select_tab: function(frm){
		if(!cur_frm.doc.__islocal){
		setTimeout(() => {
			if(cur_frm.doc.workflow_state == "Not Started"){
				$(`[id="cmr-service-eligibility_criteria_tab-tab"]`).click()
			}

			// if(cur_frm.doc.workflow_state == "Qualified" && !cur_frm.doc.aggree){
			// 	$(`[id="cmr-service-service_delivery_tab-tab"]`).click()
			// }

			if(cur_frm.doc.workflow_state == "Qualified"){
				$(`[id="cmr-service-medication_profile_tab-tab"]`).click()
			}

			if(cur_frm.doc.workflow_state == "In Progress"){
				$(`[id="cmr-service-scheduling_tab-tab"]`).click()
			}

			// if(cur_frm.doc.workflow_state == "Scheduled"){
			// 	$(`[id="cmr-service-pharmacist_tab-tab"]`).click()
			// }

			if(cur_frm.doc.workflow_state == "Scheduled"){
				$(`[id="cmr-service-medication_action_plan_map_tab-tab"]`).click()
			}

			if(!frm.doc.__islocal && (["Ready for Service", "Service Completed"].includes(frm.doc.workflow_state))){
				$(`[id="cmr-service-patient_summary_tab-tab"]`).click()
			}

			// if(cur_frm.doc.workflow_state == "Ineligible"){
			// 	cur_frm.disable_form()
			// }
		}, 150);}
	},
});

// let auto_save = function(){
// 	cur_frm.wrapper.addEventListener("input", function(){
// 		if(cur_frm.is_dirty()){
// 			cur_frm.save()
// 		}
// 	})
// }

// let setOnchangeEvents = function(frm){
// 	cur_frm.wrapper.addEventListener("click", function(){
// 		// $(`[data-label="Save"]`).remove()
// 		// 	setTimeout(() => {
// 		// 		$(`[data-label="Save"]`).remove()
// 		// 	}, 10);
// 		}
// 	)
// }

let calculate_bmi = function(frm){
	// Reference https://en.wikipedia.org/wiki/Body_mass_index
	// bmi = weight (in Kg) / height * height (in Meter)
	let feet_and_inches = frm.doc.height.split(`'`)
	let feet = feet_and_inches[0]
	let inches = feet_and_inches[1].replace(`'`, '')
	feet = feet? parseInt(feet) : 0
	inches = inches ? parseInt(inches): 0

	let toatal_inches = (feet * 12) + inches

	let height = toatal_inches * 0.0254

	let weight = frm.doc.weight *  0.453592

	let bmi = ( weight / (height * height)).toFixed(2);
	let bmi_note = null;

	if (bmi<18.5) {
		bmi_note = __('Underweight');
	} else if (bmi>=18.5 && bmi<25) {
		bmi_note = __('Normal');
	} else if (bmi>=25 && bmi<30) {
		bmi_note = __('Overweight');
	} else if (bmi>=30) {
		bmi_note = __('Obese');
	}
	frappe.model.set_value(frm.doctype,frm.docname, 'bmi', bmi);

	// frappe.model.set_value(frm.doctype,frm.docname, 'nutrition_note', bmi_note);
};

let set_bp = function(frm){
	let bp = frm.doc.bp_systolic+ '/' + frm.doc.bp_diastolic + ' mmHg';
	frappe.model.set_value(frm.doctype,frm.docname, 'bp', bp);
};

frappe.ui.form.on('Relative Medical Condition', {
	add_relative(frm, cdt, cdn) {
		let row = locals[cdt][cdn]
		if(row.add_relative){
			frappe.call({
				method: "frappe.client.get_list",
				args: {
					doctype: "Relative",
					fieldname: "name",
				},
				callback: (res)=>{
					if(res.message){
						let relative_list = res.message.map((ele)=>{return ele.name})
						let new_value = row.add_relative

						let old_values = !row.relatives ? " " :  row.relatives


						let current_values =  old_values + new_value + ", "


						let list_values = current_values.split(",")


						var uniqueList = list_values.filter(function(item, index, self) {
							return self.indexOf(item) === index;
						});

						frappe.model.set_value(cdt, cdn, "relatives", uniqueList.toString() )
						frappe.model.set_value(cdt, cdn, "add_relative", "" )
					}
				},
				async:false
				})
			}
		},
	relative_medical_conditions_add(){
		$('[class="btn-open-row"]').hide()
	},
})

frappe.ui.form.on('Eligibility Check for CMR', {
	eligibility_add(){
		$('[class="btn-open-row"]').hide()
	},
})

frappe.ui.form.on('Common Conditions', {
	health_conditions_add(){
		$('[class="btn-open-row"]').hide()
	},
})

frappe.ui.form.on('Drug Allergies Side Effects', {
	allergies_side_effects_add(){
		$('[class="btn-open-row"]').hide()
	},
})
// frappe.ui.form.on('CMR Medications', {
// 	medications_add(){
// 		$('[class="btn-open-row"]').hide()
// 	},
// })
frappe.ui.form.on('Recreational Drug Usage', {
	recreational_drug_usage_add(){
		$('[class="btn-open-row"]').hide()
	},
})

frappe.ui.form.on('Surgical History', {
	surgical_histories_add(){
		$('[class="btn-open-row"]').hide()
	},
})

frappe.ui.form.on('Environmental Factors Questionnaires', {
	employment_housing_transportation_add(){
		$('[class="btn-open-row"]').hide()
	},
})

// frappe.ui.form.on('Medication Action Plan', {
// 	medication_action_plan_add(){
// 		$('[class="btn-open-row"]').hide()
// 	},
// })

frappe.ui.form.on('Billing Code', {
	billing_code_add(){
		$('[class="btn-open-row"]').hide()
	},
})



function renderHtmlSection(frm){
	frm.get_field("agreement_html").$wrapper.html(`
			<table>
				<tr>
					<td>
						<input type="checkbox" onchange= handleAggrement(this.checked) ${cur_frm.doc.agreement? "checked" : ""}>
					</td>
					<td style="padding:5px">
						<p>
							I attest that I have reviewed and updated the patient's health, allergies, medication,
							medication action plan, and discussed how to safely dispose of unused Prescription medications.
							I will provide the CMR recipient with the exact patient takeaway generated in this platform
						</p>
					</td>
				</tr>
			</table>
		`)

	frm.get_field("notes").$wrapper.html(`
		<div>
			Telehealth requirements are as follows:
		</div>
		<ul>
			<li>Use an interactive system that is compiant with HIPAA privacy and security requirements and regulations.</li>
			<li>You will also need to have procedures in place to prevent system failures that could lead to a breach in
			privacy or <br>cause exposure of health records to unauthorized people.</li>
			<li>Equipment must be capable of displaying video full screen without reduced image quality or
			reliability and maintain a <br>minimum download speed or transmission speed of 4 Mbps.
			The video and audio must be a synchronous interaction</li>
		</ul>
	`);
	// changeRecreationalDrugUsageSection(frm)
	// changeSurgicalHistorySection(frm)
	// changeRelativeMedicalConditionsSection(frm)
	// changeEnvironmentalSection(frm)
}


function changeEnvironmentalSection(frm){
	let env_condition = cur_frm.doc.employment_housing_transportation.map((ele)=>{return ele.question_tag})

	frappe.call({
		method: "pharm_ehr_tenant.pharm_ehr_tenant.utils.get_environmental_question_list",

		callback: function(r) {
			if(r.message) {
				const question= r.message

				// /const column_max = Math.ceil(surgery_list.length / 2);
				let section = "<div></div>"
				r.message.forEach(question => {
					let question_sec = `<div id= ${question.name} style="font-size:15px; margin-bottom: 10px"> ${question.question} </div>`
					let options = "`<div>"
					if(question.question_type == 'Multiple Choice'){
						question.options.forEach(option=>{
							options += `<div style="font-size:15px; margin-bottom: 10px"><p><input id=${"opt_"+option.answer.replace(/\s/g, '_')} type="checkbox" onclick= addQuestionTableValue("${option.name.replace(/\s/g, '_')}") name= "question_tag" value="${option.answer}" ${env_condition.includes(question_tag)? "checked" : ""}>${option.answer}<br></br>`
							options += "</div>"
						})
					}
					else{
						options +=  `<select >` + `<option>Yes</option><option>No</option>` + `</select >`
					}
					question_sec += (options + "</div>")
				});


				frm.get_field("surgical_histories_html").$wrapper.html(div)
			}
		}
	});
}

this.addSurgeryTableValue = function addSurgeryTableValue (question_tag){

	var isChecked = $(`[id = "sur_${question_tag}"`).is(':checked');
	if(isChecked){
		cur_frm.add_child("surgical_histories", {"question_tag": question_tag.replace("_", ' ')})
		$(`[id= "select_${question_tag}"]`).show()
		cur_frm.refresh_field("surgical_histories")
	}
	else{
		cur_frm.dirty()
		$(`[id= "select_${question_tag}"]`).val("Last Used")
		$(`[id= "select_${question_tag}"]`).hide()
		let index = cur_frm.doc.surgical_histories.map((ele)=>{return ele.question_tag}).indexOf(question_tag.replace("_", ' '))
		cur_frm.doc.surgical_histories.splice(index,1)
		cur_frm.refresh_field("surgical_histories")
	}

}

this.addSurgeryTableYear = function addSurgeryTableYear (question_tag){

	var value = $(`[id = "select_${question_tag}"`).val()
	if(value != "Last Used" ||  value != 2024){
		let index = cur_frm.doc.surgical_histories.map((ele)=>{return ele.question_tag}).indexOf(question_tag.replace("_", ' '))
		let row = cur_frm.doc.surgical_histories[index]
		row.year = value
		cur_frm.refresh_field("surgical_histories")
	}
}



function changeRelativeMedicalConditionsSection(frm){
	let medical_condition = cur_frm.doc.relative_medical_conditions.map((ele)=>{return ele.surgery})

	frappe.call({
		method: "pharm_ehr_tenant.pharm_ehr_tenant.utils.relative_medical_conditions_list",

		callback: function(r) {
			if(r.message) {

				const condition_list= r.message['medical_condition']
				const relatives = r.message['relatives']

				const column_max = Math.ceil(condition_list.length / 2);

				let default_year =""
				let options = ""
				relatives.forEach(relative => {
					options += `<option value="${relative}">${relative}</option>`
				});

				var div = `<div id="relative_medical_conditions_html"><b></b>`

				let div1 = `<div>`
				div1 += "<div>"
					condition_list.slice(0, column_max+1).forEach(condition => {
						div1 += `<div style="font-size:15px; margin-bottom: 10px"><p><input id=${"cur_"+condition.replace(/\s/g, '_')} type="checkbox" onclick= addConditionTableValue("${condition.replace(/\s/g, '_')}") name= "condition" value="${condition}" ${medical_condition.includes(condition)? "checked" : ""}>${condition}<br>`
						div1 +=  `<select multiple id=${"select_"+condition.replace(/\s/g, '_')} class="form-control bold" width="100px" style= "${medical_condition.includes(condition) ? "" :"display:none"}" onclick= addConditionTableRelative("${condition.replace(/\s/g, '_')}")>`
						// let index = cur_frm.doc.recreational_drug_usage.map((ele)=>{return ele.drug_name}).indexOf(condition)
						// try {
						// 	var r_year = cur_frm.doc.recreational_drug_usage[index].relative
						//   } catch (error) {
						// 	var r_year = ""
						//   }
						// relatives.forEach(relative => {
						// 	options += `<option value="${relative}" ${ relative == r_year ? "selected" : ""}>${relative}</option>`
						// });
						div1 += options
						div1 += `</select>`

					});
					div1 +=  `</div>`
				div1 += "</div><div width=10%></div>"

				let div2 = `<div>`
				div2 += "<div>"
					condition_list.slice(column_max+1).forEach(condition => {
						div2 += `<div style="font-size:15px; margin-bottom: 10px"><p><input id=${"cur_"+condition.replace(/\s/g, '_')} type="checkbox" onclick=addSurgeryTableValue("${condition.replace(/\s/g, '_')}") name= "condition" value="${condition}" ${medical_condition.includes(condition)? "checked" : ""}>${condition}<br>`
						div2 +=  `<select multiple  id=${"select_"+condition.replace(/\s/g, '_')} class="form-control bold" width="100px"  style= "${medical_condition.includes(condition) ? "" :"display:none"}" onclick= addSurgeryTableYear("${condition.replace(/\s/g, '_')}")>`
						// let index = cur_frm.doc.recreational_drug_usage.map((ele)=>{return ele.drug_name}).indexOf(drug)
						// try {
						// 	var r_year = cur_frm.doc.recreational_drug_usage[index].relative
						//   } catch (error) {
						// 	var r_year = ""
						//   }
						// relatives.forEach(relative => {
						// 	options += `<option value="${relative}" ${ relative == r_year ? "selected" : ""}>${relative}</option>`
						// });

						div2 += options
						div2 += `</select>`
					});
					div2 +=  `</div>`
				div2 += "</div><div width=10%></div>"

				var table = `
				<table width= 100% style= "border-spacing: 10px;  border-collapse: separate; ">
					<tr>
						<td width= 50% style= "padding: 10px; ">
							${div1}
						</td>
						<td width= 50%  style= "padding: 10px; ">
							${div2}
						</td>
					</tr>
				</table>
				`

				div = div + table + "</div>"

				frm.get_field("relative_medical_conditions_html").$wrapper.html(div)
			}
		}
	});
}

this.addConditionTableValue = function addConditionTableValue (condition){

	var isChecked = $(`[id = "cur_${condition}"`).is(':checked');
	if(isChecked){
		cur_frm.add_child("relative_medical_conditions", {"condition": condition.replace("_", ' ')})
		$(`[id= "select_${condition}"]`).show()
		cur_frm.refresh_field("relative_medical_conditions")
	}
	else{
		cur_frm.dirty()
		$(`[id= "select_${condition}"]`).val("Last Used")
		$(`[id= "select_${condition}"]`).hide()
		let index = cur_frm.doc.relative_medical_conditions.map((ele)=>{return ele.condition}).indexOf(condition.replace("_", ' '))
		cur_frm.doc.relative_medical_conditions.splice(index,1)
		cur_frm.refresh_field("relative_medical_conditions")
	}

}

this.addConditionTableRelative = function addConditionTableRelative (condition){

	var value = $(`[id = "select_${condition}"`).val()
	if(value != "Last Used" ||  value != 2024){
		let index = cur_frm.doc.relative_medical_conditions.map((ele)=>{return ele.condition}).indexOf(condition.replace("_", ' '))
		let row = cur_frm.doc.relative_medical_conditions[index]
		row.relatives = value.toString()
		cur_frm.refresh_field("relative_medical_conditions")
	}
}



function changeSurgicalHistorySection(frm){
	let surgeries = cur_frm.doc.surgical_histories.map((ele)=>{return ele.surgery})

	frappe.call({
		method: "pharm_ehr_tenant.pharm_ehr_tenant.utils.surgical_histories_list",

		callback: function(r) {
			if(r.message) {
				const surgery_list= r.message['surgeries']
				const years = r.message['years']

				const column_max = Math.ceil(surgery_list.length / 2);

				let default_year =""
				let options = ""
				years.forEach(year => {
					options += `<option value="${year}">${year}</option>`
				});

				var div = `<div id="surgical_histories_html"><b>What surgeries have you had in the past, and in what year?</b>`

				let div1 = `<div>`
				div1 += "<div>"
					surgery_list.slice(0, column_max+1).forEach(surgery => {
						div1 += `<div style="font-size:15px; margin-bottom: 10px"><p><input id=${"sur_"+surgery.replace(/\s/g, '_')} type="checkbox" onclick= addSurgeryTableValue("${surgery.replace(/\s/g, '_')}") name= "surgery" value="${surgery}" ${surgeries.includes(surgery)? "checked" : ""}>${surgery}<br>`
						div1 +=  `<select id=${"select_"+surgery.replace(/\s/g, '_')} class="form-control bold" width="100px" style= "${surgeries.includes(surgery) ? "" :"display:none"}" onclick= addSurgeryTableYear("${surgery.replace(/\s/g, '_')}")>`
						// let index = cur_frm.doc.recreational_drug_usage.map((ele)=>{return ele.drug_name}).indexOf(surgery)
						// try {
						// 	var r_year = cur_frm.doc.recreational_drug_usage[index].year
						//   } catch (error) {
						// 	var r_year = ""
						//   }
						// years.forEach(year => {
						// 	options += `<option value="${year}" ${ year == r_year ? "selected" : ""}>${year}</option>`
						// });
						div1 += options
						div1 += `</select>`

					});
					div1 +=  `</div>`
				div1 += "</div><div width=10%></div>"

				let div2 = `<div>`
				div2 += "<div>"
					surgery_list.slice(column_max+1).forEach(surgery => {
						div2 += `<div style="font-size:15px; margin-bottom: 10px"><p><input id=${"sur_"+surgery.replace(/\s/g, '_')} type="checkbox" onclick=addSurgeryTableValue("${surgery.replace(/\s/g, '_')}") name= "surgery" value="${surgery}" ${surgeries.includes(surgery)? "checked" : ""}>${surgery}<br>`
						div2 +=  `<select id=${"select_"+surgery.replace(/\s/g, '_')} class="form-control bold" width="100px"  style= "${surgeries.includes(surgery) ? "" :"display:none"}" onclick= addSurgeryTableYear("${surgery.replace(/\s/g, '_')}")>`
						// let index = cur_frm.doc.recreational_drug_usage.map((ele)=>{return ele.drug_name}).indexOf(drug)
						// try {
						// 	var r_year = cur_frm.doc.recreational_drug_usage[index].year
						//   } catch (error) {
						// 	var r_year = ""
						//   }
						// years.forEach(year => {
						// 	options += `<option value="${year}" ${ year == r_year ? "selected" : ""}>${year}</option>`
						// });

						div2 += options
						div2 += `</select>`
					});
					div2 +=  `</div>`
				div2 += "</div><div width=10%></div>"

				var table = `
				<table width= 100% style= "border-spacing: 10px;  border-collapse: separate; ">
					<tr>
						<td width= 50% style= "padding: 10px; ">
							${div1}
						</td>
						<td width= 50%  style= "padding: 10px; ">
							${div2}
						</td>
					</tr>
				</table>
				`

				div = div + table + "</div>"

				frm.get_field("surgical_histories_html").$wrapper.html(div)
			}
		}
	});
}

this.addSurgeryTableValue = function addSurgeryTableValue (surgery){

	var isChecked = $(`[id = "sur_${surgery}"`).is(':checked');
	if(isChecked){
		cur_frm.add_child("surgical_histories", {"surgery": surgery.replace("_", ' ')})
		$(`[id= "select_${surgery}"]`).show()
		cur_frm.refresh_field("surgical_histories")
	}
	else{
		cur_frm.dirty()
		$(`[id= "select_${surgery}"]`).val("Last Used")
		$(`[id= "select_${surgery}"]`).hide()
		let index = cur_frm.doc.surgical_histories.map((ele)=>{return ele.surgery}).indexOf(surgery.replace("_", ' '))
		cur_frm.doc.surgical_histories.splice(index,1)
		cur_frm.refresh_field("surgical_histories")
	}

}

this.addSurgeryTableYear = function addSurgeryTableYear (surgery){

	var value = $(`[id = "select_${surgery}"`).val()
	if(value != "Last Used" ||  value != 2024){
		let index = cur_frm.doc.surgical_histories.map((ele)=>{return ele.surgery}).indexOf(surgery.replace("_", ' '))
		let row = cur_frm.doc.surgical_histories[index]
		row.year = value
		cur_frm.refresh_field("surgical_histories")
	}
}


function changeRecreationalDrugUsageSection(frm){
	let recreational_drugs = cur_frm.doc.recreational_drug_usage.map((ele)=>{return ele.drug_name})
	frappe.call({
		method: "pharm_ehr_tenant.pharm_ehr_tenant.utils.recreational_drug_list",

		callback: function(r) {
			if(r.message) {
				const drug_list= r.message['drugs']
				const years = r.message['years']

				const column_max = Math.ceil(drug_list.length / 2);

				let default_year =""
				let options = ""
				years.forEach(year => {
					options += `<option value="${year}">${year}</option>`
				});

				var div = `<div id="recreational_drug_usage_html">`

				let div1 = `<div>`
				div1 += "<div>"
					drug_list.slice(0, column_max+1).forEach(drug => {
						div1 += `<div style="font-size:15px; margin-bottom: 10px"><p><input id=${"rcd_"+drug.replace(/\s/g, '_')} type="checkbox" onclick= addTableValue("${drug.replace(/\s/g, '_')}") name= "drug" value="${drug}" ${recreational_drugs.includes(drug)? "checked" : ""}>${drug}<br>`
						div1 +=  `<select id=${"select_"+drug.replace(/\s/g, '_')} class="form-control bold" width="100px" style= "${recreational_drugs.includes(drug) ? "" :"display:none"}" onclick= addTableYear("${drug.replace(/\s/g, '_')}") >`
						// let index = cur_frm.doc.recreational_drug_usage.map((ele)=>{return ele.drug_name}).indexOf(drug)
						// try {
						// 	var r_year = cur_frm.doc.recreational_drug_usage[index].last_use
						//   } catch (error) {
						// 	var r_year = ""
						//   }
						// years.forEach(year => {
						// 	options += `<option value="${year}" ${ year == r_year ? "selected" : ""}>${year}</option>`
						// });
						div1 += options
						div1 += `</select>`

					});
					div1 +=  `</div>`
				div1 += "</div><div width=10%></div>"

				let div2 = `<div>`
				div2 += "<div>"
					drug_list.slice(column_max+1).forEach(drug => {
						div2 += `<div style="font-size:15px; margin-bottom: 10px"><p><input id=${"rcd_"+drug.replace(/\s/g, '_')} type="checkbox" onclick=addTableValue("${drug.replace(/\s/g, '_')}") name= "drug" value="${drug}" ${recreational_drugs.includes(drug)? "checked" : ""}>${drug}<br>`
						div2 +=  `<select id=${"select_"+drug.replace(/\s/g, '_')} class="form-control bold" width="100px"  style= "${recreational_drugs.includes(drug) ? "" :"display:none"}" onclick= addTableYear("${drug.replace(/\s/g, '_')}")>`
						// let index = cur_frm.doc.recreational_drug_usage.map((ele)=>{return ele.drug_name}).indexOf(drug)
						// try {
						// 	var r_year = cur_frm.doc.recreational_drug_usage[index].last_use
						//   } catch (error) {
						// 	var r_year = ""
						//   }
						// years.forEach(year => {
						// 	options += `<option value="${year}" ${ year == r_year ? "selected" : ""}>${year}</option>`
						// });

						div2 += options
						div2 += `</select>`
					});
					div2 +=  `</div>`
				div2 += "</div><div width=10%></div>"

				var table = `
				<table width= 100% style= "border-spacing: 10px;  border-collapse: separate; ">
					<tr>
						<td width= 50% style= "padding: 10px; ">
							${div1}
						</td>
						<td width= 50%  style= "padding: 10px; ">
							${div2}
						</td>
					</tr>
				</table>
				`

				div = div + table + "</div>"

				frm.get_field("recreational_drug_usage_html").$wrapper.html(div)
			}
		}
	});
}


this.addTableValue = function addTableValue (drug){

	var isChecked = $(`[id = "rcd_${drug}"`).is(':checked');
	if(isChecked){
		cur_frm.add_child("recreational_drug_usage", {"drug_name": drug.replace("_", ' ')})
		$(`[id= "select_${drug}"]`).show()
		cur_frm.refresh_field("recreational_drug_usage")
	}
	else{
		cur_frm.dirty()
		$(`[id= "select_${drug}"]`).val("Last Used")
		$(`[id= "select_${drug}"]`).hide()
		let index = cur_frm.doc.recreational_drug_usage.map((ele)=>{return ele.drug_name}).indexOf(drug.replace("_", ' '))
		cur_frm.doc.recreational_drug_usage.splice(index,1)
		cur_frm.refresh_field("recreational_drug_usage")
	}

}

this.addTableYear = function addTableYear (drug){

	var value = $(`[id = "select_${drug}"`).val()
	if(value != "Last Used" ||  value != 2024){
		let index = cur_frm.doc.recreational_drug_usage.map((ele)=>{return ele.drug_name}).indexOf(drug.replace("_", ' '))
		let row = cur_frm.doc.recreational_drug_usage[index]
		row.last_use = value
		cur_frm.refresh_field("recreational_drug_usage")
	}
}

let get_eligibility_criteira =  function(frm){
	frappe.call({
		method: "pharm_ehr_tenant.service_type.doctype.cmr_service.cmr_service.get_eligibility_criteria",
		args: {
			service_type: frm.doc.doctype || null,
			service_name: frm.doc.name || null
		},
		async:false,
		callback: function(r) {
			if(r.message) {


				var wrapper = frm.get_field("eligibility_criteria_html").$wrapper;
				wrapper.html("")

				var vaccine_html = `<div id="eligibility_criteria_html">`

				r.message.forEach(vac => {
					vaccine_html += `<div  class="ql-editor read-mode" style="font-size:15px;"><p><input id=${"elig_"+vac.criteria} type="checkbox" name="eligibility" value="${vac.criteria}" checked disabled >${vac.criteria}<br>`
				});

				vaccine_html +=  `</div>`
				wrapper.html(vaccine_html)
				// document.getElementById("eligibility_criteria_html").removeEventListener('change',function(){})
				// document.getElementById("eligibility_criteria_html").addEventListener('change', function(event) {
				// 	if (event.target.type === 'checkbox' && event.target.name === 'eligibility') {
				// 		frm.dirty()

				// 		handleCheckboxChange(event.target,frm);
				// 	}
				// });

			}
		}
	});
}

let toggleButtonActions = function (frm){
	if(cur_frm.doc.workflow_state == "Not Started"){
		setTimeout(()=>{
			$(`[data-label="Save"]`).remove()
		}, 60)
	}
	cur_frm.page.clear_icons()
	// cur_frm.page.clear_menu()
	cur_frm.page.clear_actions_menu()

	if(cur_frm.doc.workflow_state== "Qualified"){
		cur_frm.remove_custom_button("Check for Eligibility")
	}

	// $(`[data-label="Print"]`).parent().hide()
	$(`[data-label="Email"]`).parent().hide()
}



frappe.router.on('change', ()=>{
	try {
		let router_info = frappe.router.current_route
		let form = router_info[0] == "Form"
		let service = router_info[1] == "CMR Service"
		if (service && form){
			setTimeout(() => {
				toggleButtonActions(cur_frm)
			},100);
		}
	} catch (error) {
	}
})

function handleCheckboxChange(checkbox,frm) {
	if (checkbox.checked) {
		var ct = frm.add_child("eligibility")
		ct.criteria = checkbox.id
		frm.refresh_field("eligibility")

	} else {
		let index = cur_frm.doc.eligibility.map((ele)=>{return ele.criteria}).indexOf(checkbox.id)
		cur_frm.doc.eligibility.splice(index,1)
		frm.refresh_field("eligibility")
	}
}

this.handleAggrement = function(value){
	cur_frm.set_value("agreement", value)
}

let check_and_set_availability = function(frm, app_type="") {

	let selected_slot = null;
	let service_unit = null;
	let duration = null;
	let overlap_appointments = null;

	show_availability();

	function show_empty_state(practitioner, appointment_date) {
		frappe.msgprint({
			title: __('Not Available'),
			message: __('Healthcare Practitioner {0} not available on {1}', [practitioner.bold(), appointment_date.bold()]),
			indicator: 'red'
		});
	}

	function show_availability() {
		let selected_practitioner = '';
		let fields_list=[]
		let filters = [];
		if(app_type){
			filters = [
				["Appointment Type", "custom_default_followup", "=", 1]
			]
		}
		fields_list = [
			{ fieldtype: 'Link', options: 'Medical Department', reqd: 1, fieldname: 'department', label: 'Medical Department', hidden:1},
			{ fieldtype: 'Link', options: 'Appointment Type', reqd: 1, fieldname: 'appointment_type', label: 'Appointment Type',get_query: () => {
				return {
					filters: filters
				};
			},},
			{ fieldtype: 'Date', reqd: 1, fieldname: 'appointment_date', label: 'Date', min_date: new Date(frappe.datetime.get_today())},
			{ fieldtype: 'Column Break' },
			{ fieldtype: 'Link', options: 'Healthcare Practitioner', fieldname: 'practitioner', label: 'Healthcare Practitioner',hidden:1 },
			{ fieldtype: 'Link', options: 'Healthcare Service Unit', reqd: 1, fieldname: 'service_unit', label: 'Location' },
			// { fieldtype: 'Link', options: 'Patient', reqd: 1, fieldname: 'patient', label: 'Patient', default: cur_frm.doc.patient_name, read_only:1 },
			{ fieldtype: 'Section Break' },
			{ fieldtype: 'HTML', fieldname: 'available_slots' },
		]
		let d = new frappe.ui.Dialog({
			title: __('New Appointment'),
			fields: fields_list,
			primary_action_label: __('Book an appointment'),
			primary_action: async function() {
				frappe.call({
					method: "pharm_ehr_tenant.service_type.doctype.cmr_service.cmr_service.create_patient_appointment",
					args: {args : {
						// appointment_time: selected_slot,
						appointment_type: d.get_value('appointment_type'),
						// practitioner: d.get_value('practitioner'),
						patient: frm.doc.patient_name,
						department: d.get_value('department'),
						appointment_date: d.get_value('appointment_date'),
						service_unit:  d.get_value("service_unit"),
						doctype: frm.doc.doctype,
						docname: frm.doc.name,
						is_new: app_type
					}},
					callback: ()=>{
						cur_frm.reload_doc()
						frappe.run_serially(
							()=> frm.dirty(),
							()=> frm.save(),
							()=> cur_frm.reload_doc(),
						)

					}

				}
				)

				d.hide();

				// d.get_primary_btn().attr('disabled', true);
			}
		});

		d.set_values({
			'department': frappe.defaults.get_default("medical_department")? frappe.defaults.get_default("medical_department"):"Pharmacy",
			// 'practitioner': frm.doc.practitioner,
			"service_unit":frm.doc.custom_location_of_service,
			'appointment_date': frm.doc.appointment_date || frappe.datetime.nowdate(),
			'appointment_type':  app_type ? app_type : cur_frm.doc.custom_select_appointment_type
		});

		let selected_department = frm.doc.department;

		d.fields_dict['department'].df.onchange = () => {
			if (selected_department != d.get_value('department')) {
				d.set_values({
					'practitioner': ''
				});
				selected_department = d.get_value('department');
			}
			if (d.get_value('department')) {
				d.fields_dict.practitioner.get_query = function() {
					return {
						filters: {
							'department': selected_department
						}
					};
				};
			}
		};

		// disable dialog action initially
		// d.get_primary_btn().attr('disabled', true);

		// Field Change Handler

		// let fd = d.fields_dict;

		// d.fields_dict['appointment_date'].df.onchange = () => {
		// 	show_slots(d, fd);
		// };
		// d.fields_dict['practitioner'].df.onchange = () => {
		// 	if (d.get_value('practitioner') && d.get_value('practitioner') != selected_practitioner) {
		// 		selected_practitioner = d.get_value('practitioner');
		// 		show_slots(d, fd);
		// 	}
		// };

		d.show();
	}

	function show_slots(d, fd) {
		if (d.get_value('appointment_date') && d.get_value('practitioner')) {
			fd.available_slots.html('');
			frm.doc.invoiced = null
			frappe.call({
				method: 'healthcare.healthcare.doctype.patient_appointment.patient_appointment.get_availability_data',
				args: {
					practitioner: d.get_value('practitioner'),
					date: d.get_value('appointment_date'),
					appointment: frm.doc
				},
				callback: (r) => {
					let data = r.message;
					if (data.slot_details.length > 0) {
						let $wrapper = d.fields_dict.available_slots.$wrapper;

						// make buttons for each slot
						let slot_html = get_slots(data.slot_details, data.fee_validity, d.get_value('appointment_date'));

						$wrapper
							.css('margin-bottom', 0)
							.addClass('text-center')
							.html(slot_html);

						// highlight button when clicked
						$wrapper.on('click', 'button', function() {
							let $btn = $(this);
							$wrapper.find('button').removeClass('btn-outline-primary');
							$btn.addClass('btn-outline-primary');
							selected_slot = $btn.attr('data-name');
							service_unit = $btn.attr('data-service-unit');
							appointment_based_on_check_in = $btn.attr('data-day-appointment');
							duration = $btn.attr('data-duration');
							add_video_conferencing = parseInt($btn.attr('data-tele-conf'));
							overlap_appointments = parseInt($btn.attr('data-overlap-appointments'));
							// show option to opt out of tele conferencing
							if ($btn.attr('data-tele-conf') == 1) {
								if (d.$wrapper.find(".opt-out-conf-div").length) {
									d.$wrapper.find(".opt-out-conf-div").show();
								} else {
									overlap_appointments ?
										d.footer.prepend(
											`<div class="opt-out-conf-div ellipsis text-muted" style="vertical-align:text-bottom;">
												<label>
													<span class="label-area">
													${__("Video Conferencing disabled for group consultations")}
													</span>
												</label>
											</div>`
										)
									:
										d.footer.prepend(
											`<div class="opt-out-conf-div ellipsis" style="vertical-align:text-bottom;">
											<label>
												<input type="checkbox" class="opt-out-check"/>
												<span class="label-area">
												${__("Do not add Video Conferencing")}
												</span>
											</label>
										</div>`
										);
								}
							} else {
								d.$wrapper.find(".opt-out-conf-div").hide();
							}

							// enable primary action 'Book'
							d.get_primary_btn().attr('disabled', null);
						});

					} else {
						//	fd.available_slots.html('Please select a valid date.'.bold())
						show_empty_state(d.get_value('practitioner'), d.get_value('appointment_date'));
					}
				},
				freeze: true,
				freeze_message: __('Fetching Schedule...')
			});
		} else {
			fd.available_slots.html(__('Appointment date and Healthcare Practitioner are Mandatory').bold());
		}
	}

	function get_slots(slot_details, fee_validity, appointment_date) {
		let slot_html = '';
		let appointment_count = 0;
		let disabled = false;
		let start_str, slot_start_time, slot_end_time, interval, count, count_class, tool_tip, available_slots;

		slot_details.forEach((slot_info) => {
			slot_html += `<div class="slot-info">`;
			if (fee_validity && fee_validity != 'Disabled') {
				slot_html += `
					<span style="color:green">
					${__('Patient has fee validity till')} <b>${moment(fee_validity.valid_till).format('DD-MM-YYYY')}</b>
					</span><br>`;
			} else if (fee_validity != 'Disabled') {
				slot_html += `
					<span style="color:red">
					${__('Patient has no fee validity')}
					</span><br>`;
			}

			slot_html += `
				<span><b>
				${__('Practitioner Schedule: ')} </b> ${slot_info.slot_name}
					${slot_info.tele_conf && !slot_info.allow_overlap ? '<i class="fa fa-video-camera fa-1x" aria-hidden="true"></i>' : ''}
				</span><br>
				<span><b> ${__('Service Unit: ')} </b> ${slot_info.service_unit}</span>`;
				if (slot_info.service_unit_capacity) {
					slot_html += `<br><span> <b> ${__('Maximum Capacity:')} </b> ${slot_info.service_unit_capacity} </span>`;
				}

				slot_html += '</div><br>';

				slot_html += slot_info.avail_slot.map(slot => {
						appointment_count = 0;
						disabled = false;
						count_class = tool_tip = '';
						start_str = slot.from_time;
						slot_start_time = moment(slot.from_time, 'HH:mm:ss');
						slot_end_time = moment(slot.to_time, 'HH:mm:ss');
						interval = (slot_end_time - slot_start_time) / 60000 | 0;

						// restrict past slots based on the current time.
						let now = moment();
						let booked_moment = ""
						if((now.format("YYYY-MM-DD") == appointment_date) && (slot_start_time.isBefore(now) && !slot.maximum_appointments)){
							disabled = true;
						} else {
							// iterate in all booked appointments, update the start time and duration
							slot_info.appointments.forEach((booked) => {
								booked_moment = moment(booked.appointment_time, 'HH:mm:ss');
								let end_time = booked_moment.clone().add(booked.duration, 'minutes');

								// to get apointment count for all day appointments
								if (slot.maximum_appointments) {
									if (booked.appointment_date == appointment_date) {
										appointment_count++;
									}
								}
								// Deal with 0 duration appointments
								if (booked_moment.isSame(slot_start_time) || booked_moment.isBetween(slot_start_time, slot_end_time)) {
									if (booked.duration == 0) {
										disabled = true;
										return false;
									}
								}

								// Check for overlaps considering appointment duration
								if (slot_info.allow_overlap != 1) {
									if (slot_start_time.isBefore(end_time) && slot_end_time.isAfter(booked_moment)) {
										// There is an overlap
										disabled = true;
										return false;
									}
								} else {
									if (slot_start_time.isBefore(end_time) && slot_end_time.isAfter(booked_moment)) {
										appointment_count++;
									}
									if (appointment_count >= slot_info.service_unit_capacity) {
										// There is an overlap
										disabled = true;
										return false;
									}
								}
							});
						}
						if (slot_info.allow_overlap == 1 && slot_info.service_unit_capacity > 1) {
							available_slots = slot_info.service_unit_capacity - appointment_count;
							count = `${(available_slots > 0 ? available_slots : __('Full'))}`;
							count_class = `${(available_slots > 0 ? 'badge-success' : 'badge-danger')}`;
							tool_tip =`${available_slots} ${__('slots available for booking')}`;
						}

						if (slot.maximum_appointments) {
							if (appointment_count >= slot.maximum_appointments) {
								disabled = true;
							}
							else {
								disabled = false;
							}
							available_slots = slot.maximum_appointments - appointment_count;
							count = `${(available_slots > 0 ? available_slots : __('Full'))}`;
							count_class = `${(available_slots > 0 ? 'badge-success' : 'badge-danger')}`;
							return `<button class="btn btn-secondary" data-name=${start_str}
								data-service-unit="${slot_info.service_unit || ''}"
								data-day-appointment=${1}
								data-duration=${slot.duration}
								${disabled ? 'disabled="disabled"' : ""}>${slot.from_time} -
								${slot.to_time} ${slot.maximum_appointments ?
								`<br><span class='badge ${count_class}'>${count} </span>` : ''}</button>`
						} else {

						return `
							<button class="btn btn-secondary" data-name=${start_str}
								data-duration=${interval}
								data-service-unit="${slot_info.service_unit || ''}"
								data-tele-conf="${slot_info.tele_conf || 0}"
								data-overlap-appointments="${slot_info.service_unit_capacity || 0}"
								style="margin: 0 10px 10px 0; width: auto;" ${disabled ? 'disabled="disabled"' : ""}
								data-toggle="tooltip" title="${tool_tip || ''}">
								${start_str.substring(0, start_str.length - 3)}
								${slot_info.service_unit_capacity ? `<br><span class='badge ${count_class}'> ${count} </span>` : ''}
							</button>`;

				}
			}).join("");

				if (slot_info.service_unit_capacity) {
					slot_html += `<br/><small>${__('Each slot indicates the capacity currently available for booking')}</small>`;
				}
				slot_html += `<br/><br/>`;

		});

		return slot_html;
	}
};
