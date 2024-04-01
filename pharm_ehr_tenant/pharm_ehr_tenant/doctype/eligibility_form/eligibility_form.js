// Copyright (c) 2024, Aerele and contributors
// For license information, please see license.txt

frappe.ui.form.on("Eligibility Form", {
	
    after_save:function(frm){
        setTimeout(() => {
            if(frappe.get_prev_route().length && frappe.get_prev_route()[0] == "Form" && frappe.get_prev_route()[1] == "CMR Service"){
                frappe.set_route(frappe.get_prev_route()[0],frappe.get_prev_route()[1],frappe.get_prev_route()[2])
            }
        }, 1000);
    },
    before_save:function(frm){
        frm.trigger("set_table_values")
     },
    set_table_values:function(frm){
        setTimeout(() => {
            for(let row of cur_frm.doc.eligibility){
                let ele = $(`input[id="elig_${row.criteria.split(".")[0]}"]`)
                ele[0].checked = true;
            }
        }, 300);
    },
    // service_type:function(frm){
    //     if(!frm.doc.service_type || !frm.doc.service_name){
    //         var wrapper = frm.get_field("eligibility_html").$wrapper;
    //         wrapper.html("")
    //         return
    //     }
    //     console.log("service_type")
    //             var wrapper = frm.get_field("eligibility_html").$wrapper;
    //             wrapper.html("")
    //             const condition_area = $(frm.fields_dict.eligibility_html.wrapper);
    //             frm.eligibility_editor = new frappe.EligibilityEditor(condition_area, frm);
    //             // frm.refresh_fields()
            
        
       
    // },
    refresh:function(frm) {
        if(frm.doc.service_name){
            frm.add_custom_button(__('CMR Service'), function(){
                frappe.set_route("Form","CMR Service",frm.doc.service_name)
    
            },"View")
     
        }
        frappe.call({
            method: "pharm_ehr_tenant.pharm_ehr_tenant.utils.get_all_eligibility_criteria",
            args: {
                service_type: frm.doc.service_type || null,
                service_name:frm.doc.service_name || null
            },

            callback: function(r) {
                if(r.message) {
                    
                    var wrapper = frm.get_field("eligibility_html_orig").$wrapper;
                    wrapper.html("")
                     
                     var vaccine_html = `<div id="eligibility_html_orig">`
                    for(let vac of r.message){
                        vaccine_html += `<div  class="ql-editor read-mode" style="font-size:15px;"><p><input id=${"elig_"+vac.split(".")[0]} type="checkbox" name="eligibility" value="${vac}" >${vac}<br>`
                    }
                    
                    vaccine_html +=  `</div>`
                    wrapper.html(vaccine_html)
                    document.getElementById("eligibility_html_orig").removeEventListener('change',function(){})
                    document.getElementById("eligibility_html_orig").addEventListener('change', function(event) {
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
                let ele = $(`input[id="elig_${row.criteria.split(".")[0]}"]`)
                ele[0].checked = true;
            }
        }, 300);
        
	},
});
function handleCheckboxChange(checkbox,frm) {
    if (checkbox.checked) {
        var ct = frm.add_child("eligibility")
        ct.criteria = checkbox.value
        frm.refresh_field("eligibility")

    } else {
        let index = cur_frm.doc.eligibility.map((ele)=>{return ele.criteria}).indexOf(checkbox.value)
        cur_frm.doc.eligibility.splice(index,1)
        frm.refresh_field("eligibility")
    }
    //  for(let d of selectedRows){
    //     var ct = frm.add_child("eligibility")
    //     ct.criteria = d
    //  }
    //  frm.refresh_field("eligibility")
     
}

