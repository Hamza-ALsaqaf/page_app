frappe.pages['activity-1'].on_page_load = function(wrapper) {
	let page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Activity page',
		single_column: true
	});
	console.log(page);
	let $btn = page.set_primary_action('New', () => {console.log("save clicked")}, 'octicon octicon-plus');
	setup_fields(page);
	
}
function setup_fields(page){
	let is_docyment_field_add=false;
	let is_fieldname_add=false;
	let doctype_field = page.add_field({
		label: 'Document Type',
		fieldtype: 'Link',
		fieldname: 'document_type',
		options: 'DocType',
		change() {
			const doctype = doctype_field.get_value()
			if(!is_docyment_field_add)
			{
				let document_field = page.add_field({
					label: 'Document',
					fieldtype: 'Link',
					fieldname: 'document',
					options: doctype,
					change() {
						const document_name = document_field.get_value();
						if(!is_fieldname_add)
						{
							let fieldname = page.add_field({
								label: 'Document',
								fieldtype: 'Select',
								fieldname: 'fieldname',
								options: ['document', 'name'],
							});
						}
						else{
							//handel later
							//FetchFromControl.vue
						}
						
						is_docyment_field_add=true;
					}
				});

			}
			else{
				//handel later
			}
			

		}
	});
}	