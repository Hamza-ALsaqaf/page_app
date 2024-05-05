frappe.provide("page_app.activity");
frappe.pages['activity_test'].on_page_load = function(wrapper) {
	var me = this;
	frappe.ui.make_app_page({
		parent: wrapper,
		single_column: true,
	});
	me.page = wrapper.page;
	me.page.set_title(__("Activity"));

	let a = frappe.model.with_doctype("Communication", function () {
		me.page.list = new page_app.ActivityTest({
			doctype: "Communication",
			parent: wrapper,
		});
	});
	page_app.activity.render_heatmap(me.page, frappe.avatar("Administrator", "avatar-large"));

	me.page.main.on("click", ".activity-message", function () {
		var link_doctype = $(this).attr("data-link-doctype"),
			link_name = $(this).attr("data-link-name"),
			doctype = $(this).attr("data-doctype"),
			docname = $(this).attr("data-docname");

		[link_doctype, link_name, doctype, docname] = [
			link_doctype,
			link_name,
			doctype,
			docname,
		].map(decodeURIComponent);

		link_doctype = link_doctype && link_doctype !== "null" ? link_doctype : null;
		link_name = link_name && link_name !== "null" ? link_name : null;

		if (doctype && docname) {
			if (link_doctype && link_name) {
				frappe.route_options = {
					scroll_to: { doctype: doctype, name: docname },
				};
			}

			frappe.set_route(["Form", link_doctype || doctype, link_name || docname]);
		}
	});

	// Build Report Button
	if (frappe.boot.user.can_get_report.indexOf("Feed") != -1) {
		this.page.add_menu_item(
			__("Build Report"),
			function () {
				frappe.set_route("List", "Feed", "Report");
			},
			"fa fa-th"
		);
	}

	this.page.add_menu_item(
		__("Activity Log"),
		function () {
			frappe.route_options = {
				user: frappe.session.user,
			};

			frappe.set_route("List", "Activity Log", "Report");
		},
		"fa fa-th"
	);

};
frappe.pages["activity_test"].on_page_show = function () {
	frappe.breadcrumbs.add("Desk");
};

page_app.activity.last_feed_date = false;

page_app.activity.Feed = class Feed {
	constructor(row, data) {
		this.scrub_data(data);
		this.add_date_separator(row, data);
		if (!data.add_class) data.add_class = "label-default";

		data.link = "";
		if (data.link_doctype && data.link_name) {
			data.link = frappe.format(
				data.link_name,
				{ fieldtype: "Link", options: data.link_doctype },
				{ label: __(data.link_doctype) + " " + __(data.link_name) }
			);
		} else if (data.feed_type === "Comment" && data.comment_type === "Comment") {
			// hack for backward compatiblity
			data.link_doctype = data.reference_doctype;
			data.link_name = data.reference_name;
			data.reference_doctype = "Communication";
			data.reference_name = data.name;

			data.link = frappe.format(
				data.link_name,
				{ fieldtype: "Link", options: data.link_doctype },
				{ label: __(data.link_doctype) + " " + __(data.link_name) }
			);
		} else if (data.reference_doctype && data.reference_name) {
			data.link = frappe.format(
				data.reference_name,
				{ fieldtype: "Link", options: data.reference_doctype },
				{ label: __(data.reference_doctype) + " " + __(data.reference_name) }
			);
		}

		$(row).append(frappe.render_template("activity_row", data)).find("a").addClass("grey");
	}

	scrub_data(data) {
		data.by = frappe.user.full_name(data.owner);
		data.avatar = frappe.avatar(data.owner,"avatar-large");

		data.icon = "fa fa-flag";

		// color for comment
		data.add_class =
			{
				Comment: "label-danger",
				Assignment: "label-warning",
				Login: "label-default",
			}[data.comment_type || data.communication_medium] || "label-info";

		data.when = comment_when(data.creation);
		data.feed_type = data.comment_type || data.communication_medium;
	}

	add_date_separator(row, data) {
		var date = frappe.datetime.str_to_obj(data.creation);
		var last = page_app.activity.last_feed_date;

		if (
			(last && frappe.datetime.obj_to_str(last) != frappe.datetime.obj_to_str(date)) ||
			!last
		) {
			var diff = frappe.datetime.get_day_diff(
				frappe.datetime.get_today(),
				frappe.datetime.obj_to_str(date)
			);
			var pdate;
			if (diff < 1) {
				pdate = "Today";
			} else if (diff < 2) {
				pdate = "Yesterday";
			} else {
				pdate = frappe.datetime.global_date_format(date);
			}
			data.date_sep = pdate;
			data.date_class = pdate == "Today" ? "date-indicator blue" : "date-indicator";
		} else {
			data.date_sep = null;
			data.date_class = "";
		}
		page_app.activity.last_feed_date = date;
	}
};


page_app.activity.render_heatmap = function (page, avatar) {
	$(
		`
		<div class="card heatmap-container">
		<div class="action-icons">
				<button class="btn btn-primary"><i class="fas fa-plus"></i></button> <!-- Add icon button -->
			</div>
            <div class="row">
                <div class="col-md-2">
                    ${ avatar }
                </div>
                <div class="col-md-10">
                    <h4 class="card-title ">الإجراء الأساسي: إنشاء معاملة</h4>
                    <p class="card-subtitle">الوجهة: قسم المالية</p>
                    <p class="card-text"><span class="info-label">رقم المهملات:</span> TR12345</p>
                    <p class="card-text"><span class="info-label">موضوع البريد الوارد:</span> طلب معاملة جديدة</p>
                    <p class="card-text"><span class="info-label">نوع الإجراء:</span> إنشاء</p>
                    <p class="card-text"><span class="info-label">وجهة البريد الوارد:</span> مجلد الوارد</p>
                    <p class="card-text"><span class="info-label">تاريخ الإضافة:</span> 1 مايو، 2024</p>
                </div>
            </div>
        </div>
		`
	).prependTo(page.main);

	
};

page_app.ActivityTest = class ActivityTest extends frappe.views.BaseList {
	constructor(opts) {
		super(opts);
		this.show();
	}

	setup_defaults() {
		super.setup_defaults();

		this.page_title = __("Activity");
		this.doctype = "Communication";
		this.method = "frappe.desk.page.activity.activity.get_feed";
	}

	setup_filter_area() {
		//
	}

	setup_view_menu() {
		//
	}

	setup_sort_selector() { }

	setup_side_bar() { }

	get_args() {
		return {
			start: this.start,
			page_length: this.page_length,
		};
	}

	update_data(r) {
		let data = r.message || [];

		if (this.start === 0) {
			this.data = data;
		} else {
			this.data = this.data.concat(data);
		}
	}

	render() {
		this.data.map((value) => {
			const row = $('<div class="row">')
				.data("data", value)
				.appendTo(this.$result)
				.get(0);
			new page_app.activity.Feed(row, value);
			// console.log(value);
		});
	}
};
