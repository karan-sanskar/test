// Copyright (c) 2024, Aerele and contributors
// For license information, please see license.txt

frappe.ui.form.on("Choose Vaccine Type", {
	refresh:function(frm) {
        frappe.call({
            method: "pharm_ehr_tenant.pharm_ehr_tenant.doctype.choose_vaccine_type.choose_vaccine_type.get_vaccine_types",
            // args: {
            //     company: company,
            // },
            callback: function(r) {
                if(r.message) {
                    var wrapper = frm.get_field("vaccine_html").$wrapper;
                     wrapper.html("")
                     var vaccine_html = `<div id="vaccine_type">`
                    for(let vac of r.message){
                        vaccine_html += `<input type="checkbox" name="vaccine_name" value="${vac}" >${vac}<br>`
                    }
                    vaccine_html +=  `</div>`
                    wrapper.html(vaccine_html)
                    document.getElementById("vaccine_type").addEventListener('change', function(event) {
                        if (event.target.type === 'checkbox' && event.target.name === 'vaccine_name') {
                            frm.dirty()
                            handleCheckboxChange(event.target);
                        }
                    });

                }
            }
        });
        
	},
});
var selectedRows = [];
function handleCheckboxChange(checkbox) {
    if (checkbox.checked) {
        selectedRows.push(checkbox.value);
    } else {
        selectedRows = selectedRows.filter(row => row !== checkbox.value);
    }
     console.log(selectedRows)
}