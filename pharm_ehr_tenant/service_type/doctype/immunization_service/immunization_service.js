// Copyright (c) 2024, Aerele and contributors
// For license information, please see license.txt
frappe.provide("erpnext");
frappe.ui.form.on("Immunization Service", {

	onload_post_render(frm) {
		toggleButtonActions(frm)
		add_wokflow_button(frm)

		if(cur_frm.doc.__islocal){
			setTimeout(()=>{
				$(`[data-label="Save"]`).remove()
			}, 60)
		}
	},
	show_progress: function(frm) {
		frm.dashboard.hide_progress()
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

	patient_name:function(frm){
		frm.trigger("render_vaccine_data")
		frappe.call({
			doc: frm.doc,
			method: "get_patient_address"
		}).then((r)=>{
			if(r.message.address){
				frm.set_value("patient_address", r.message.address)
				frm.trigger("patient_address")
				
			}
			else{
				frm.set_value("patient_address", "")
				frm.trigger("patient_address")
			}
		})
	},
	after_save:function(frm){
		frm.trigger("render_vaccine_data")
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
	payment_type: function(frm){
		if(frm.doc.payment_type != "Insurance"){
			frm.set_value("billing_code", [])
		}
	},
    setup:function(frm){
		frm.set_query("custom_select_appointment_type", function(frm) {
			return {
				filters: [
					["Appointment Type","custom_service_type","=",cur_frm.doc.doctype]
				]
			};
		});
		frm.set_query("item_code", "billing_code", function (frm) {
			return {
				// query: "pharm_ehr_tenant.pharm_ehr_tenant.utils.get_item",
				filters: 
					{
						"item_group":"Immunization Service",
						// "duration": cur_frm.doc.total_service_durationin_minutes
					}
			};
		});
        frm.set_query("patient_address", function() {
			return {
				filters: [
					["Dynamic Link","link_doctype", "=", "Patient"],
                    ["Dynamic Link","link_name", "=", frm.doc.patient_name]
				]
			};
		});
		frm.set_query("questionnaire_template", function() {
			return {
				filters:{
					service_type:"Immunization Service"
				}
			};
		});
		frm.set_query("vaccine", "vaccine_details", function (frm) {
			return {
				filters: 
					{
						"custom_is_vaccine":1
					}
			};
		});
    },
	questionnaire_template:function(frm){
		if(frm.doc.questionnaire_template){
			console.log("true")
			var wrapper = frm.get_field("questionnaires").$wrapper;
			wrapper.html("")
			frm.trigger("render_vaccine_data")
		}
		
	},
	refresh:function(frm) {
		$("[data-fieldname='billing_code']").find(".btn.btn-xs.btn-secondary.grid-add-row")[0].textContent = "Add a billing code"
		frm.trigger("render_vaccine_data")
		frm.trigger("show_appointment")
		frappe.db.get_list('Patient Appointment',
			{filters:{"custom_service_type": frm.doc.doctype,"custom_service_name":frm.doc.name},fields: ['name','appointment_type']}).then((res) => {
				res.map((r) => {
					cur_frm.add_custom_button(__(`<a href="/app/patient-appointment/${r.name}">${r.appointment_type}</a>`), function () {
					},"View Appointments")
				})
				
			})
			frappe.call({
				method: "pharm_ehr_tenant.pharm_ehr_tenant.utils.get_docdata_for_select",
				args: {
					doctype:cur_frm.doc.doctype
				},
				callback: function(r){
					if(r.message.length){
						// if(r.message[0].length){
						// 	var default_template = ""
						// 	for(let i of r.message[0]){
						// 		if(i.make_this_default){
						// 			default_template = i.name
						// 			break
						// 		}
						// 	}
						// 	cur_frm.set_df_property("patient_eligibility_template","options",r.message[0].map((d)=>d.name).join("\n"))
						// 	cur_frm.set_value("patient_eligibility_template",default_template)
							
						// }
						if(r.message[1].length){
							cur_frm.set_df_property("custom_location_of_service","options",r.message[1].join("\n"))
							if(r.message[1].length == 1){
								cur_frm.set_value("custom_location_of_service",r.message[1][0])
							}
	
						}
					}
				}
			})

		

		if(!frm.doc.__islocal){
			frm.trigger('show_progress');
		}

		cur_frm.dashboard.progress_area.body.prependTo($(`[class="form-tabs-list"]`))

		toggleButtonActions(frm)
		add_wokflow_button(frm)

	},
	
	show_appointment(frm) {
		if (frm.doc.name) {
			frappe.call({
				method: "pharm_ehr_tenant.service_type.doctype.immunization_service.immunization_service.get_patient_appointments",
				args: {
					
					doctype: frm.doc.doctype,
					docname: frm.doc.name,

				},
				callback: (r) => {
					if (!r.exc) {
						var appointment_html = frappe.render_template('appointment', {
							column: r.message.column,
							column2: r.message.column2
						});
						var wrapper = frm.get_field("appointment_html").$wrapper;
						wrapper.html(appointment_html)				
						// $(appointment_html).appendTo(me.open_appointments);

						frm.trigger("create_appointment")
					}
				}
			});
		}
	// 	const patient_appointment = new erpnext.utils.PatientAppointment({
	// 		frm: this.frm,
	// 		check_and_set_availability,
	// 		open_appointments: $(this.frm.fields_dict.appointment_html.wrapper)
	// 	});
	// 	patient_appointment.refresh();
	},
	create_appointment (frm) {
		
		let _create_appointment = () => {
			

		};
		let _edit_date_and_time = (event) => {
			console.log(event.currentTarget.dataset.date)
			var d = new frappe.ui.Dialog({
				title: __("Edit Date and Time"),
				fields: [
					{
						label: "Appointment Date",
						fieldname: "date",
						fieldtype: "Date",
						default: event.currentTarget.dataset.date,
					},
					{
						label: "Appointment Time",
						fieldname: "time",
						fieldtype: "Time",
						default: event.currentTarget.dataset.time,
					},
				],
				primary_action: function () {
					var data = d.get_values();
					frappe.call({
						method: "pharm_ehr_tenant.service_type.doctype.cmr_service.cmr_service.save_date_and_time",
						args: {
						   appointment : event.currentTarget.id || "",
						   date:data.date,
						   time:data.time
						},
						callback: (r) => {
							frappe.run_serially([
								()=>  frm.trigger("show_appointment"),
								()=>  frm.save(),
								// ()=>  window.location.reload(),
								]
							)
							d.hide()
						   
						   
						   
							
						}
					})
					
					
				},
				primary_action_label: __("Save"),
			});
			d.show();
		}
		// $(".new-appointment-btn").click(_create_appointment);
		$(".edit-date-and-time").click(_edit_date_and_time);
	},
	render_vaccine_data:function(frm){
		frappe.call({
            method: "pharm_ehr_tenant.service_type.doctype.immunization_service.immunization_service.get_all_vaccine_questionnaire",
            args: {
                patient: frm.doc.patient_name || null,
                service_type:frm.doc.doctype || null,
				template:frm.doc.questionnaire_template || ""
            },

            callback: function(r) {
                if(r.message) {
					var wrapper = frm.get_field("questionnaires").$wrapper;
					wrapper.html("")
					if(frm.doc.questionnaire_template){
						var vaccine_html = `<div  id="questionnaires">`
						for(let arr of r.message){
							vaccine_html +=`
										
										
										<table style="width: 100%; border-collapse: collapse;">
												<tbody>
													<tr>
														<td style="width:85%;padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">${arr["question"]}</td>`
										
											vaccine_html += `<td style="width:5%;padding: 8px; text-align: left; border-bottom: 1px solid #ddd;"><input id="${arr["q_id"]}-yes" type="checkbox" name="question">Yes</td>`
										
										
											vaccine_html += `<td style="width:5%;padding: 8px; text-align: left; border-bottom: 1px solid #ddd;"><input id="${arr["q_id"]}-no" type="checkbox" name="question">No</td>`
										
										
											vaccine_html += `<td style="width:5%;padding: 8px; text-align: left; border-bottom: 1px solid #ddd;"><input id="${arr["q_id"]}-na" type="checkbox" name="question">N/A</td>`
										
										
										vaccine_html += `</tr>
										<tr>
										<td></td>
										</tr>
									</tbody>
								</table>
							`			
						}
						vaccine_html += `</div>`
						wrapper.html(vaccine_html)
						document.getElementById("questionnaires").removeEventListener('change',function(){})
						document.getElementById("questionnaires").addEventListener('change', function(event) {
							if (event.target.type === 'checkbox' && event.target.name === 'question') {
								frm.dirty()
								
								handleCheckboxChange(event.target,frm);
							}
						});
						setTimeout(() => {
							for(let row of cur_frm.doc.questions_store){
								let ele = $(`input[id="${row.criteria}"]`)
								if(ele.hasOwnProperty(0)){
									ele[0].checked = true;
								}
								
							}
						}, 300);
						
					}
					else{
						
							
							
							var vaccine_html = `<div  id="questionnaires">`
							Object.keys(r.message).forEach(key => {
								vaccine_html += `<div style="padding: 8px;" id="${key}"><b>${key}</b>`
								for(let arr of r.message[key]){
										vaccine_html +=`
										
										
										<table style="width: 100%; border-collapse: collapse;">
												<tbody>
													<tr>
														<td style="width:85%;padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">${arr["desc"]}</td>`
										if(arr["yes"]){
											vaccine_html += `<td style="width:5%;padding: 8px; text-align: left; border-bottom: 1px solid #ddd;"><input id="yes" type="checkbox" checked>Yes</td>`
										}
										else{
											vaccine_html += `<td style="width:5%;padding: 8px; text-align: left; border-bottom: 1px solid #ddd;"><input id="yes" type="checkbox">Yes</td>`
										}
										if(arr["no"]){
											vaccine_html += `<td style="width:5%;padding: 8px; text-align: left; border-bottom: 1px solid #ddd;"><input id="no" type="checkbox" checked>No</td>`
										}
										else{
											vaccine_html += `<td style="width:5%;padding: 8px; text-align: left; border-bottom: 1px solid #ddd;"><input id="no" type="checkbox" >No</td>`
										}
										if(arr["na"]){
											vaccine_html += `<td style="width:5%;padding: 8px; text-align: left; border-bottom: 1px solid #ddd;"><input id="na" type="checkbox" checked>N/A</td>`
										}
										else{
											vaccine_html += `<td style="width:5%;padding: 8px; text-align: left; border-bottom: 1px solid #ddd;"><input id="na" type="checkbox" >N/A</td>`
										}
										vaccine_html += `</tr>
										<tr>
										<td></td>
										</tr>
									</tbody>
								</table>
							`			
								}
								vaccine_html += `</div>`

								
							})

							vaccine_html +=  `</div>`
							wrapper.html(vaccine_html)
						
					}
					
                }
            }
        });
	}
});
function handleCheckboxChange(checkbox,frm) {
	if (checkbox.checked) {
		console.log(checkbox.id)
		var ct = frm.add_child("questions_store")
		ct.criteria = checkbox.id
		frm.refresh_field("questions_store")

	} else {
		let index = cur_frm.doc.questions_store.map((ele)=>{return ele.criteria}).indexOf(checkbox.id)
		cur_frm.doc.questions_store.splice(index,1)
		frm.refresh_field("questions_store")
	}
}

let toggleButtonActions = function (frm){
	setTimeout(() => {
		cur_frm.page.clear_icons()
		cur_frm.page.clear_actions_menu()
		$(`[data-label="Email"]`).parent().hide()
	}, 100);
	
}

let add_wokflow_button = function(frm){

	if(cur_frm.doc.__islocal){
		cur_frm.add_custom_button(__("Next"), function () {
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
				},
				()=> window.location.reload()
			])
							
		}).addClass('btn btn-primary');
	}

	if(!cur_frm.doc.__islocal && cur_frm.doc.workflow_state== "Not Sent"){
		cur_frm.add_custom_button(__("Next: Ready to Claim"), function () {
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
								action: "Ready to Claim",
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
			}
		).addClass('btn btn-primary');
	}
	if(cur_frm.doc.workflow_state== "Ready to Claim"){
		cur_frm.add_custom_button(__("Next: Complete"), function () {
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
								action: "Complete",
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
			}
		).addClass('btn btn-primary');
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
	if(cur_frm.doc.workflow_state== "Service Completed"){
		cur_frm.add_custom_button(__("Patient Take Away"), function () {
			frappe.run_serially([
				()=> {
					frappe.call({
						method: "pharm_ehr_tenant.pharm_ehr_tenant.utils.attach_pdf",
						args: {
							'doc_name': frm.doc.name,
							'doc_type': frm.doc.doctype
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
	}
}