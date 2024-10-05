
    var tableManagement = {
        typeIs: null,
        holder: null,
        data: [],
        subdata: [],
        currSearchBy: "All",
        currSearchValue: "",
        currSearchOwner: "N",
        currSearchEmpty: "Y",
        search: null,

        init: function(node, type) {
            tableManagement.holder = node;
            tableManagement.typeIs = type;
            node.innerHTML = tableManagement.getHTML();
            tableManagement.getData(tableManagement.categories.init);
        },

        getHTML: function() {
            return "<div class='table-management-page'>" + "<div class='table-management-main'>" +
                "<div class='table-management-actions'>" + "<div id='tableSearch'></div>" + "<div class='table-management-buttons'>" + "</div>" + "</div>" +
                "<div class='row table-management-grid'></div>" + "</div>" + "<div class='table-management-data kv-hide'></div>" + "</div>";
        },

        getData: function(cb) {
		  	var self = this;
            var filter = {
                "filter.RootFolder": tableManagement.typeIs == "user" ? "Client Folder" : "Kirov Folder",
                "filter.MyForm": tableManagement.currSearchOwner == "Y",
                "filter.Name": tableManagement.currSearchValue,
                "filter.FormId": tableManagement.currSearchValue,
                "filter.ViewId": tableManagement.currSearchValue,
                "filter.FormRole": "Data",
                "filter.UseOrLogic": !!tableManagement.currSearchValue,
                "filter.AddEmptyFolders": tableManagement.currSearchEmpty == "Y",
            };
            if (!!tableManagement.currSearchBy && tableManagement.currSearchBy !== "All") {
                filter["filter.FormDataSource"] = tableManagement.currSearchBy;
            }
            var ds = new kendo.data.DataSource({
                type: "rfb-v2",
                transport: {
                    read: {
                        url: "/builder/FormNavigation/tree-data",
                        type: "POST",
                        data: filter
                    },
                }
            });
            ds.read().then(function() {
                var data = ds.view();
			  	var pId = data[0].id.split(":")[0];

			  	self.pId = pId;
			  	self.data = [...data[0].items.filter(itm => itm.id.split(":")[0] !== pId)];
                cb();
            });
        },

        categories: {
            accordion: null,

            init: function() {
                tableManagement.holder.querySelector(".table-management-grid").innerHTML = "";
                tableManagement.search = { ...searchWidget
                };
                let accordionConfig = {
                    height: "",
                    title: function(itm) {
                        return itm.text + " (" + (!!itm.items && !!itm.items.length ? itm.items.length : 0) + " tables)";
                    },
                    subtitle: "",
                    detailsCard: function(el, itm) {
                        return tableManagement.categories.cards.init(el, itm);
                    },
                    dataSource: tableManagement.data,
                    searchConfig: {
                        position: 'top',
                        searchBar: {
                            enabled: true,
                            placeholder: "Enter value to search",
                            value: tableManagement.currSearchValue,
                            onChange: function(val) {
                                tableManagement.currSearchValue = val;
                                tableManagement.getData(tableManagement.categories.init);
                            },
                        },
                        dropdowns: [{
                            label: "Table Type",
                            data: "searchType",
                            values: ["All", "Internal", "External", ],
                            options: ["All", "Internal", "External", ],
                            value: tableManagement.currSearchBy,
                            change: function(e) {
                                tableManagement.currSearchBy = e.target.value;
                                tableManagement.getData(tableManagement.categories.init);
                            },
                        }, ],
                        toggles: [{
                                label: "Owned by me",
                                data: "searchOwner",
                                values: ["N", "Y", ],
                                value: tableManagement.currSearchOwner,
                                change: function(e) {
                                    tableManagement.currSearchOwner = tableManagement.currSearchOwner == "Y" ? "N" : "Y";
                                    tableManagement.getData(tableManagement.categories.init);
                                },
                            },
                            {
                                label: "Show empty folders",
                                data: "searchEmpty",
                                values: ["N", "Y", ],
                                value: tableManagement.currSearchEmpty,
                                change: function(e) {
                                    tableManagement.currSearchEmpty = tableManagement.currSearchEmpty == "Y" ? "N" : "Y";
                                    tableManagement.getData(tableManagement.categories.init);
                                },
                            },
                        ]
                    },
                    toolbar: /*tableManagement.typeIs == "user" ?*/ [{
                        icon: "kv-icon-plus",
                        text: "Add Folder",
                        action: function(e) {
                            tableManagement.categories.categoriesEditor.init(null, function() {
                                tableManagement.getData(tableManagement.categories.init);
                            });
                        }
                    }, ], /*: [],*/
                    actions: /*tableManagement.typeIs == "user" ?*/ [
					  {
                        label: "Add Table",
                        id: "AddaTable",
                        icon: "kv-icon-plus",
                        tooltip: "Add Table",
                        action: function(itm) {
                            tableManagement.tables.tablesCreator.initCreate(itm.id.split(":")[0], function() {
                                tableManagement.getData(tableManagement.categories.init);
                            });
                        },
                    }, 
					
					  {
                        label: "Delete Table",
                        id: "DeleteaTable",
                        icon: "kv-icon-trash",
                        tooltip: "Delete Table",
                        action: function(itm) {
                            mo.fn.modal.show({
                                close: true,
                                ctaLabel: "Confirm",
                                closeLabel: "Cancel",
                                title: "Please confirm operation",
                                content: "You are about to delete the folder " + itm.text,
                                ctaCallback: function() {
                                    mo.fn.overlay.show({
                                        close: false,
                                        loading: true
                                    });
                                    const request = new XMLHttpRequest();
                                    request.onreadystatechange = () => {
                                        if (request.readyState === 4) {
                                            mo.fn.overlay.hide();
                                            const resp = JSON.parse(request.response);
                                            if (request.status == 400 || !resp.success) {
                                                mo.fn.notification.show(resp.message, 3, 0, 5);
                                            } else {
                                                mo.fn.modal.hide();
                                                mo.fn.notification.show("Table Deleted Successfully", 1, 0, 5);
                                                tableManagement.getData(tableManagement.categories.init);
                                            }
                                        }
                                    };
                                    request.open("DELETE", "/builder/FormNavigation/delete");
                                    const formData = new FormData();
                                    formData.append("targetId", itm.id.split(":")[0]);
                                    formData.append("type", "folder");
                                    request.send(formData);
                                }
                            });
                        },
                    },
					    {
                        label: "Edit Table",
                        id: "EditaTable",
                        icon: "kv-icon-settings-01",
                        tooltip: "Edit Table",
                        action: function(itm) {
                            tableManagement.categories.categoriesEditor.init(itm, function() {
                                tableManagement.getData(tableManagement.categories.init);
                            });
                        },
                    } 
					
					] /*: []*/
                };
                tableManagement.categories.accordion = { ...accordionComponent };
                tableManagement.categories.accordion.init(tableManagement.holder.querySelector(".table-management-grid"), accordionConfig);
            },

            cards: {
                init: function(node, groupItm) {
                    tableManagement.subdata = tableManagement.data.find(function(user) {
                        return user.id === groupItm.id;
                    });
                    node.innerHTML = "<div id='tm-group-" + groupItm.id + "-cards' class='tm-cards'></div>";
                    var collection = { ...cardCollectionComponent
                    };
                    var conf = {
                        height: "",
                        dataSource: {
                            data: tableManagement.subdata.items,
                            schema: {},
                            pageSize: 4
                        },
                        card: {
                            id: function(rowItm) {
                                return rowItm.ViewId + "-tm";
                            },
                            title: function(rowItm) {
                                return rowItm.text;
                            },
                            badge: function(rowItm) {
							  var ext = rowItm.extraData.dataSourceType == "External"; 
							  return {
								id: rowItm.Id+"-table-badge",
								color: ext ? "success" : "info", 
								text: ext ? "External" : "Internal"};
							},
                            description: function(rowItm) {
                                return (rowItm.extraData.description ? rowItm.extraData.description : "");
                            },
                            content: function(rowItm) {
                                return "<div>" + "<div style='display: flex; align-items: center; justify-content: space-between; margin: 0;flex-wrap: wrap;'>" +
                                    "<p>Active: " + (rowItm.extraData.active ? "Y" : "N") + "</p>" + "<p>Locked: " + (rowItm.extraData.locked ? "Y" : "N") + "</p>" +
                                    "<p>SOR Synced: " + (rowItm.extraData.sorSync ? "Y" : "N") + "</p>" + "<p>Authentication: " + (rowItm.extraData.authentication ? "Y" : "N") + "</p>" +
                                    "</div>" +
                                    "<div style='display: flex; align-items: center; justify-content: space-between; margin: 5px 0;flex-wrap: wrap;'><p><strong>Friendly URL: </strong>" +
                                    (rowItm.extraData.friendlyName ? rowItm.extraData.friendlyName : "N/A") + "</p>" + "<p><strong>Owner: </strong>" +
                                    (rowItm.extraData.owner ? rowItm.extraData.owner : "N/A") + "</p></div></div>";
                            },
                            updatedDate: function(rowItm) {
                                if (rowItm.extraData.details) return (rowItm.extraData.details.modified ? rowItm.extraData.details.modified : "n/a");
                                else return "n/a";
                            },
                            updatedBy: function(rowItm) {
                                if (rowItm.extraData.details) return (rowItm.extraData.details.modifiedBy ? rowItm.extraData.details.modifiedBy : "n/a");
                                else return "n/a";
                            },
                            createdDate: function(rowItm) {
                                if (rowItm.extraData.details) return (rowItm.extraData.details.created ? rowItm.extraData.details.created : "n/a");
                                else return "n/a";
                            },
                            createdBy: function(rowItm) {
                                if (rowItm.extraData.details) return (rowItm.extraData.details.createdBy ? rowItm.extraData.details.createdBy : "n/a");
                                else return "n/a";
                            },
                            actions: [{
                                icon: "kv-icon-filter-lines kv-medium",
                                tooltip: "Filter",
                                action: function(t) {
                                    tableManagement.tableFilter.init(t)
                                },
                                /*visibility: function(rowObj) {
                                    return tableManagement.typeIs == "user";
                                },*/
                            }, {
                                icon: "kv-icon-dataflow kv-medium",
                                tooltip: "Columns",
                                action: function(t) {
                                    tableManagement.columnEditor.init(t);
                                },
                            }, {
                                icon: "kv-icon-server kv-medium",
                                tooltip: "Data",
                                action: function(t) {
                                    tableManagement.dataEditor.init(t);
                                },
                            },
                            {
                            icon: "kv-icon-trash kv-medium",
                            tooltip: "Delete",
                            action: function(t) {
                                mo.fn.modal.show({
                                close: true,
                                ctaLabel: "Confirm",
                                closeLabel: "Cancel",
                                title: "Please confirm operation",
                                content: "You are about to delete the form " + t.text,
                                ctaCallback: function() {
                                    mo.fn.overlay.show({
                                    close: false,
                                    loading: true
                                    });
                                    const request = new XMLHttpRequest();
                                    request.onreadystatechange = () => {
                                    if (request.readyState === 4) {
                                        mo.fn.overlay.hide();
                                        const resp = JSON.parse(request.response);
                                        if (request.status == 400 || !resp.success) {
                                        mo.fn.notification.show(resp.message, 3);
                                        } else {
                                        mo.fn.modal.hide();
                                        tableManagement.getData(tableManagement.categories.init);
                                        }
                                    }
                                    };
                                    request.open("DELETE", "/builder/FormNavigation/delete");
                                    const formData = new FormData();
                                    formData.append("targetId", t.id.split(":")[0]);
                                    formData.append("type", "form");
                                    request.send(formData);
                                }
                                });
                            },
                            /*visibility: function(rowObj) {
                                return tableManagement.typeIs == "user";
                            },*/
                            }, 
                            {
                            icon: /*tableManagement.typeIs == "user" ?*/ "kv-icon-settings-01", /*: "kv-icon-info-circle kv-medium",*/
                            tooltip: /*tableManagement.typeIs == "user" ?*/ "Edit", /*: "Info",*/
                            action: function(t) {
                                tableManagement.tables.tableEditor.init(t, function() {
                                tableManagement.getData(tableManagement.categories.init);
                                });
                            },
                            }  ],
						},
                    };
                    collection.init(node.querySelector(".tm-cards"), conf);
                },
            },

            categoriesEditor: {
                conf: null,
                init: function(itm, callback) {
                    mo.fn.slider.setContent("<div id='categoryEditor'></div>");
                    var node = document.querySelector("#categoryEditor");
                    node.classList.add("kv-nbsf");
                    let conf = {
                        id: "editor",
                        dom: node,
                        page: 0,
                        pages: [{
                            title: (!!itm ? "Editing folder" : "Adding folder"),
                            nav: true,
                            structure: [{
                                group: [
                                    [{
                                        label: "Folder Name",
                                        type: "text",
                                        placeholder: "Enter a name here",
                                        data: "Name",
                                        value: !!itm ? itm.Name : "",
                                        validation: ["minLen|1", "maxLen|255", "dataField"],
                                    }],
                                ]
                            }, ],
                            callback: function() {},
                        }, ],
                        onSubmit: function(page, currDS) {
                            mo.fn.overlay.show({
                                close: false,
                                loading: true
                            });
                            const request = new XMLHttpRequest();
                            request.onreadystatechange = () => {
                                if (request.readyState === 4) {
                                    const resp = JSON.parse(request.response);
                                    mo.fn.overlay.hide();
                                    if (request.status !== 200 || !resp.success) {
                                        mo.fn.overlay.show({
                                            close: false,
                                            loading: false
                                        });
                                        mo.fn.notification.show(resp.message, 3, 0, 5);
                                    } else {
                                        mo.fn.slider.toggle();
                                        callback(request.response);
                                    }
                                }
                            };
                            request.open("POST", "/builder/FormNavigation/catagory-update");
                            const formData = new FormData();
                            formData.append("ParentId", tableManagement.pId);
                            formData.append("FolderId", !!itm ? itm.id.split(":")[0] : "");
                            formData.append("Name", currDS.Name);
                            request.send(formData);
                        }
                    };
                    var ds = {
                        Name: !!itm ? itm.text : ""
                    };
                    conf.dataset = ds;
                    tableManagement.categories.categoriesEditor.conf = { ...conf
                    };
                    nbsf.init(conf, 0, ds);
                    mo.fn.slider.toggle();
                },
            },

        },

        tables: {
            init: function(node, itm) {
                if (!!itm.items && !!itm.items.length) {
                    var el = node.querySelector("#node_" + itm.id.replace(":", "_") + "_children");
                    itm.items.map(t => {
                        let wrapper = document.createElement("div");
                        wrapper.id = "node_" + t.id.replace(":", "_");
                        el.appendChild(wrapper);
                        const conf = {
                            id: "node_" + t.id.replace(":", "_") + "_content",
                            buttons: [{
                                id: "node_" + t.id.replace(":", "_") + "_filter",
                                icon: "filter_icon",
                                action: function() {
                                    tableManagement.tableFilter.init(t);
                                },
                            }, {
                                id: "node_" + t.id.replace(":", "_") + "_columns",
                                icon: "columns_icon",
                                action: function() {
                                    tableManagement.columnEditor.init(t);
                                },
                            }, {
                                id: "node_" + t.id.replace(":", "_") + "_edit",
                                icon: "data_icon",
                                action: function() {
                                    tableManagement.dataEditor.init(t);
                                },
                            }, {
                                id: "node_" + t.id.replace(":", "_") + "_edit",
                                icon: "edit_icon",
                                action: function() {
                                    tableManagement.tables.tableEditor.init(t, function() {
                                        tableManagement.getData(tableManagement.categories.init);
                                    });
                                },
                            }, {
                                id: "node_" + t.id.replace(":", "_") + "_remove",
                                icon: "delete_icon",
                                action: function() {
                                    mo.fn.modal.show({
                                        close: true,
                                        ctaLabel: "Confirm",
                                        closeLabel: "Cancel",
                                        title: "Please confirm operation",
                                        content: "You are about to delete the form " + t.text,
                                        ctaCallback: function() {
                                            mo.fn.overlay.show({
                                                close: false,
                                                loading: true
                                            });
                                            const request = new XMLHttpRequest();
                                            request.onreadystatechange = () => {
                                                if (request.readyState === 4) {
                                                    mo.fn.overlay.hide();
                                                    const resp = JSON.parse(request.response);
                                                    if (request.status == 400 || !resp.success) {
                                                        mo.fn.notification.show(resp.message, 3, 0, 5);
                                                    } else {
                                                        mo.fn.modal.hide();
                                                        tableManagement.getData(tableManagement.categories.init);
                                                    }
                                                }
                                            };
                                            request.open("DELETE", "/builder/FormNavigation/delete");
                                            const formData = new FormData();
                                            formData.append("targetId", t.id.split(":")[0]);
                                            formData.append("type", "form");
                                            request.send(formData);
                                        }
                                    });
                                },
                            }, ],
                            title: t.text,
                            content: tableManagement.tables.renderContent(t)
                        };
                        const exp = { ...expandableBlock
                        };
                        exp.init(wrapper, conf, function() {});
                    });
                }
            },

            renderContent: function(itm) {
                return "<div class='table-content'>" + "<div class='table-description'>" + itm.extraData.details ? itm.extraData.details.description : '' + "</div>" +
                    "<div class='table-details'>" + "<div class='table-info-block'>Created: " + itm.extraData.details ? itm.extraData.details.created : '' + "</div>" +
                    "<div class='table-info-block'>Created By: " + itm.extraData.details ? itm.extraData.details.createdBy : '' + "</div>" +
                    "<div class='table-info-block'>Modified: " + itm.extraData.details ? itm.extraData.details.modified : '' + "</div>" +
                    "<div class='table-info-block'>Modified By: " + itm.extraData.details ? itm.extraData.details.modifiedBy : '' + "</div>" + "</div>" + "</div>"
            },

            tablesCreator: {
                conf: null,
                initCreate: function(category, callback) {
                    mo.fn.slider.setContent("<div id='tableEditor'></div>");
                    var node = document.querySelector("#tableEditor");
                    node.classList.add("kv-nbsf");
                    const groups = [{
                        label: "Form Name",
                        type: "text",
                        placeholder: "Enter a name here",
                        data: "Name",
                        value: "",
                        required: true,
                        validation: ["minLen|1", "maxLen|255"],
                    }, {
                        label: "Friendly Name",
                        type: "text",
                        placeholder: "Enter a friendly name here",
                        data: "FriendlyName",
                        value: "",
                        required: false,
                        validation: ["maxLen|255", "dataField"],
                    }, {
                        label: "Description",
                        type: "textarea",
                        placeholder: "Enter a descriptione here",
                        data: "Description",
                        value: "",
                        required: false,
                        validation: ["maxLen|255"],
                    }, {
                        label: "Data Source",
                        data: "DataSourceType",
                        type: "select",
                        ignoreSelectOne: true,
                        values: ["Internal", "External"],
                        options: ["Internal", "External"],
                        value: "",
                    }, {
                        label: "SQL Provider",
                        data: "Provider",
                        type: "select",
                        ignoreSelectOne: true,
                        required: true,
                        values: ["MSSQL", "RedShift"],
                        options: ["MS SQL", "Amazon RedShift"],
                        value: "",
                        filter: function(config) {
                            return config.dataset.DataSourceType === "External";
                        }
                    }, {
                        label: "Server",
                        type: "text",
                        data: "Server",
                        value: "",
                        required: true,
                        validation: ["minLen|3"],
                        filter: function(config) {
                            return config.dataset.DataSourceType === "External";
                        }
                    }, {
                        label: "Port",
                        type: "text",
                        data: "Port",
                        value: "",
                        required: false,
                        validation: ["isInteger"],
                        filter: function(config) {
                            return config.dataset.DataSourceType === "External";
                        }
                    }, {
                        label: "Database",
                        type: "text",
                        data: "Database",
                        value: "",
                        required: true,
                        validation: ["minLen|3"],
                        filter: function(config) {
                            return config.dataset.DataSourceType === "External";
                        }
                    }, {
                        label: "User",
                        type: "text",
                        data: "User",
                        value: "",
                        required: true,
                        validation: ["minLen|1"],
                        filter: function(config) {
                            return config.dataset.DataSourceType === "External";
                        }
                    }, {
                        label: "Password",
                        type: "password",
                        data: "Password",
                        value: "",
                        required: false,
                        validation: [],
                        filter: function(config) {
                            return config.dataset.DataSourceType === "External";
                        }
                    }, {
                        label: "Table",
                        type: "text",
                        data: "Table",
                        value: "",
                        required: true,
                        validation: ["minLen|1"],
                        filter: function(config) {
                            return config.dataset.DataSourceType === "External";
                        }
                    }, {
                        label: "Unique Identity Field",
                        type: "text",
                        data: "UniqueIdentityField",
                        value: "",
                        required: true,
                        validation: ["minLen|1"],
                        filter: function(config) {
                            return config.dataset.DataSourceType === "External";
                        }
                    }, ];
                    let conf = {
                        id: "editor",
                        dom: node,
                        page: 0,
                        pages: [{
                            title: ("Creating a table"),
                            nav: true,
                            structure: [{
                                group: [groups, ]
                            }, ],
                            callback: function() {},
                        }, ],
                        onSubmit: function(page, currDS) {
                            if (currDS.DataSourceType == "External") {
                                mo.fn.overlay.show({
                                    close: false,
                                    loading: true
                                });
                                const checkConn = new XMLHttpRequest();
                                checkConn.onreadystatechange = () => {
                                    if (checkConn.readyState === 4) {
                                        const resp = checkConn.response;
                                        if (checkConn.status !== 200 || resp !== "true") {
                                            mo.fn.overlay.show({
                                                close: false,
                                                loading: false
                                            });
                                            mo.fn.notification.show("Connection to the database failed", 3, 0, 5);
                                        } else {
                                            const request = new XMLHttpRequest();
                                            request.onreadystatechange = () => {
                                                if (request.readyState === 4) {
                                                    mo.fn.overlay.hide();
                                                    if (request.status !== 200) {
                                                        mo.fn.overlay.show({
                                                            close: false,
                                                            loading: false
                                                        });
                                                        mo.fn.notification.show("Unknown error", 3, 0, 5);
                                                    } else {
                                                        const resp = JSON.parse(request.response);
                                                        mo.fn.slider.toggle();
                                                        callback(request.response);
                                                    }
                                                }
                                            };
                                            request.open("POST", "/builder/form/configuration/save");
                                            const formData = new FormData();
                                            formData.append("CategoryId", currDS.CategoryId);
                                            formData.append("DataSourceType", currDS.DataSourceType);
                                            formData.append("Role", "Data");
                                            formData.append("Name", currDS.Name);
                                            formData.append("FriendlyName", currDS.FriendlyName || "");
                                            formData.append("Description", currDS.Description || "");
                                            formData.append("Provider", currDS.Provider);
                                            formData.append("Server_input", currDS.Server);
                                            formData.append("Server", currDS.Server);
                                            formData.append("Port", currDS.Port);
                                            formData.append("Database", currDS.Database);
                                            formData.append("ServerUserId", currDS.User);
                                            formData.append("ServerPassword", currDS.Password);
                                            formData.append("TableName", currDS.Table);
                                            formData.append("UniqueIdentityField", currDS.UniqueIdentityField);
                                            request.send(formData);
                                        }
                                    }
                                };
                                checkConn.open("POST", "/builder/data-sources/test");
                                const cn = {
                                    provider: currDS.Provider,
                                    database: currDS.Database,
                                    server: currDS.Server,
                                    port: currDS.Port,
                                    driver: null,
                                    user: currDS.User,
                                    pwd: currDS.Password,
                                    table: currDS.Table
                                };
                                const cData = new FormData();
                                cData.append("cn", JSON.stringify(cn));
                                checkConn.send(cData);
                            } else {
                                mo.fn.overlay.show({
                                    close: false,
                                    loading: true
                                });
                                const request = new XMLHttpRequest();
                                request.onreadystatechange = () => {
                                    if (request.readyState === 4) {
                                        mo.fn.overlay.hide();
                                        const resp = JSON.parse(request.response);
                                        if (request.status !== 200) {
                                            mo.fn.overlay.show({
                                                close: false,
                                                loading: false
                                            });
                                            mo.fn.notification.show(resp.message, 3, 0, 5);
                                        } else {
                                            mo.fn.slider.toggle();
                                            callback(request.response);
                                        }
                                    }
                                };
                                request.open("POST", "/builder/form/configuration/save");
                                const formData = new FormData();
                                formData.append("CategoryId", currDS.CategoryId);
                                formData.append("DataSourceType", currDS.DataSourceType);
                                formData.append("Role", "Data");
                                formData.append("Name", currDS.Name);
                                formData.append("FriendlyName", currDS.FriendlyName || "");
                                formData.append("Description", currDS.Description || "");
                                formData.append("X-Requested-With", currDS["X-Requested-With"]);
                                request.send(formData);
                            }
                        }
                    };
                    var ds = {
                        "X-Requested-With": "XMLHttpRequest",
                        CategoryId: category,
                        DataSourceType: "Internal",
                        Role: "Data",
                        Name: "",
                        FriendlyName: "",
                        Description: "",
                        Provider: "",
                        Server: "",
                        Port: "",
                        Database: "",
                        User: "",
                        Password: "",
                        Table: "",
                        UniqueIdentityField: "",
                    };
                    conf.dataset = ds;
                    tableManagement.tables.tablesCreator.conf = { ...conf
                    };
                    nbsf.init(conf, 0, ds);
                    mo.fn.slider.toggle();
                },
            },

            tableEditor: {
                currTab: null,
                currItm: null,
                details: null,
                node: null,
                isAddFileActive: false,
                isImportDataActive: false,
                currSearchValue: "",
                uniqueFields: [],
                init: function(itm, callback) {
                    tableManagement.tables.tableEditor.currItm = { ...itm
                    };
                    mo.fn.slider.setContent("<div id='tableEditor'><div id='tableTabs'></div><div id='tableDetails'></div></div>");
                    tableManagement.tables.tableEditor.node = document.querySelector("#tableEditor");
                    tableManagement.tables.tableEditor.node.classList.add("kv-nbsf");
                    const cb = function() { /* mo.fn.overlay.hide(); */
                        mo.fn.slider.toggle();
                        tableManagement.tables.tableEditor.tabsInit(callback);
                    }; /* mo.fn.overlay.show({close:false, loading: true}); */
                    const request = new XMLHttpRequest();
                    request.onreadystatechange = () => {
                        if (request.readyState === 4) {
                            const resp = JSON.parse(request.response);
                            if (request.status == 400) {
                                tableManagement.tables.tableEditor.details = null; /* mo.fn.overlay.hide(); */
                                mo.fn.notification.show(resp.Message || "Unknown error", 3, 0, 5);
                            } else {
                                tableManagement.tables.tableEditor.details = { ...resp
                                };
                                tableManagement.tables.tableEditor.getUniqueFields(tableManagement.tables.tableEditor.getFileList(cb));
                            }
                        }
                    };
                    const formData = new FormData();
                    formData.append("formId", itm.id.split(":")[0]);
                    request.open("POST", "/builder/FormConfigurationWidget/form-data");
                    request.send(formData);
                },

                tabsInit: function(callback) {
                    const details = tableManagement.tables.tableEditor.details;
                    var tabConfig = {
                        tabs: [{
                            label: "Configuration",
                            id: "table-configuration",
                            active: true,
                            click: function(e) {
                                tableManagement.tables.tableEditor.currTab = "Configuration";
                                tableManagement.tables.tableEditor.configurationInit(callback);
                            },
                        }, {
                            label: "SQL",
                            id: "table-sql",
                            active: true,
                            click: function(e) {
                                tableManagement.tables.tableEditor.currTab = "SQL";
                                tableManagement.tables.tableEditor.sqlInit(callback);
                            },
                        }],
                        skipContainers: true,
                    };
                    if (details.sqlConnectionInfo.type == "External") {
                        tabConfig.tabs.push({
                            label: "Connection",
                            id: "table-conn",
                            active: true,
                            click: function(e) {
                                tableManagement.tables.tableEditor.currTab = "Connection";
                                tableManagement.tables.tableEditor.connInit(callback);
                            },
                        });
                    } else {
                        //if (tableManagement.typeIs == "user") {
                            tabConfig.tabs.push({
                                label: "FTP",
                                id: "table-ftp",
                                active: true,
                                click: function(e) {
                                    tableManagement.tables.tableEditor.currTab = "FTP";
                                    tableManagement.tables.tableEditor.ftpInit(callback);
                                },
                            });
                        //}
                    }
                    let el = document.querySelector("#tableEditor > #tableTabs");
                    tableManagement.tables.tableEditor.tabs = { ...tabs
                    };
                    tableManagement.tables.tableEditor.tabs.init(el, tabConfig);
                },

                configurationInit: function(callback) {
                    var details = tableManagement.tables.tableEditor.details;
                    tableManagement.tables.tableEditor.node.querySelector("#tableDetails").innerHTML = "<div id='tableDetailsForm'></div>";
                    var el = tableManagement.tables.tableEditor.node.querySelector("#tableDetailsForm");
                    /*if (tableManagement.typeIs == "system") {
                        tableManagement.tables.tableEditor.node.querySelector("#tableDetailsForm").classList.add("kv-nbsf-readonly");
                    }*/

                    let conf = {
                        id: "editor",
                        dom: el,
                        page: 0,
                        pages: [{
                            title: "",
                            nav: /*tableManagement.typeIs == "user" ? */true,// : false,
                            structure: [{
                                group: [
                                    [{
                                        label: "Form Name",
                                        type: "text",
                                        placeholder: "Enter a name here",
                                        data: "Name",
                                        validation: ["minLen|3", "maxLen|255"],
                                        required: false,
                                        disabled: /*tableManagement.typeIs == "user" ? */false,// : true
                                    }, {
                                        label: "Form Friendly Name",
                                        type: "text",
                                        placeholder: "Enter a friendly name here",
                                        data: "FriendlyName",
                                        validation: ["minLen|3", "maxLen|255", "dataField"],
                                        required: false,
                                        disabled: /*tableManagement.typeIs == "user" ? */false,// : true
                                    }, {
                                        label: "Business Owner email",
                                        type: "email",
                                        placeholder: "Enter a email here",
                                        data: "Owner",
                                        validation: ["isEmail"],
                                        required: false,
                                        disabled: /*tableManagement.typeIs == "user" ? */false,// : true
                                    }, {
                                        label: "Description",
                                        type: "textarea",
                                        placeholder: "Enter a description here",
                                        data: "Description",
                                        validation: ["maxLen|255"],
                                        required: false,
                                        disabled: /*tableManagement.typeIs == "user" ? */false,// : true
                                    }, {
                                        label: "Active",
                                        data: "IsActive",
                                        type: "toggle",
                                        values: ["0", "1"],
                                        disabled: /*tableManagement.typeIs == "user" ? */false,// : true
                                    }, {
                                        label: "Locked",
                                        data: "IsLock",
                                        type: "toggle",
                                        values: ["0", "1"],
                                        disabled: /*tableManagement.typeIs == "user" ? */false,// : true
                                    }, {
                                        label: "SOR Synced",
                                        data: "SORSync",
                                        type: "toggle",
                                        values: ["0", "1"],
                                        disabled: /*tableManagement.typeIs == "user" ? */false,// : true
                                    }, {
                                        label: "Authentication",
                                        data: "IsAuth",
                                        type: "toggle",
                                        values: ["0", "1"],
                                        disabled: /*tableManagement.typeIs == "user" ? */false,// : true
                                    }, ],
                                ]
                            }, ],
                        }, ],
                        onSubmit: function(page, currDS) {
                            mo.fn.overlay.show({
                                close: false,
                                loading: true
                            });
                            const cb = function() {
                                const formData = new FormData();
                                formData.append("FormId", currDS.FormId);
                                formData.append("CategoryId", currDS.CategoryId);
                                formData.append("TreeSelectedPath", currDS.TreeSelectedPath);
                                formData.append("Name", currDS.Name);
                                formData.append("FriendlyName", currDS.FriendlyName || "");
                                formData.append("FormRole", currDS.FormRole || "");
                                formData.append("Description", currDS.Description || "");
                                formData.append("Owner", currDS.Owner || "");
                                formData.append("CategoryName", currDS.CategoryName);
                                formData.append("IsActive", currDS.IsActive === "1");
                                formData.append("IsLock", currDS.IsLock === "1");
                                formData.append("SORSync", currDS.SORSync === "1");
                                formData.append("RequiresUserAuthentication", currDS.IsAuth === "1");
                                const request = new XMLHttpRequest();
                                request.onreadystatechange = () => {
                                    if (request.readyState === 4) {
                                        mo.fn.overlay.hide();
                                        const resp = JSON.parse(request.response);
                                        if (request.status == 400 || !resp.success) {
                                            mo.fn.overlay.show({
                                                close: false,
                                                loading: false
                                            });
                                            mo.fn.notification.show(resp.message, 3, 0, 5);
                                        } else {
                                            mo.fn.slider.toggle();
                                            callback();
                                        }
                                    }
                                };
                                request.open("POST", "/builder/FormConfigurationWidget/update/" + details.formId);
                                request.send(formData);
                            }; /* if((currDS.IsAuth === "1") !== details.requiresUserAuthentication) { const crequest = new XMLHttpRequest(); const cformData = new FormData(); cformData.append("AlwaysApplyAudienceFilter", "false"); cformData.append("RequiresUserAuthentication", (currDS.IsAuth === "1")); cformData.append("AudienceFilterRule_input", ""); cformData.append("AudienceFilterRule", ""); cformData.append("ApplyAudienceRuleToFormData", "false"); cformData.append("X-Requested-With", "XMLHttpRequest"); crequest.onreadystatechange = () => { if (crequest.readyState === 4) { mo.fn.overlay.hide(); const resp = JSON.parse(crequest.response); if(crequest.status == 400 || !resp) { mo.fn.modal.show({ close: false, ctaLabel: "OK", title: "ERROR", content: resp.Message, }); } else { cb(); } } } crequest.open("POST", "/builder/forms/" + details.formId + "/extending/setting"); crequest.send(cformData); } else { cb(); } */
                            cb();
                        }
                    };
                    var ds = {
                        FormId: details.formId,
                        CategoryId: details.categoryId,
                        TreeSelectedPath: details.categoryId,
                        Name: details.name || "",
                        FriendlyName: details.friendlyName || "",
                        FormRole: "Data",
                        Description: details.description || "",
                        CategoryName: details.categoryName || "",
                        Owner: details.owner || "",
                        IsActive: details.isActive ? "1" : "0",
                        IsLock: details.isLock ? "1" : "0",
                        SORSync: details.sorSync ? "1" : "0",
                        IsAuth: details.requiresUserAuthentication ? "1" : "0",
                    };
                    conf.dataset = ds;
                    tableManagement.tables.tableEditor.conf = { ...conf
                    };
                    nbsf.init(conf, 0, ds);
                },
                sqlInit: function(cb) {
                    var details = tableManagement.tables.tableEditor.details;
                    var el = tableManagement.tables.tableEditor.node.querySelector("#tableDetails");

                    el.innerHTML = "<div id='table-sql-data'></div>" +
                        "<div id='table-sql-buttons'>" +
                        //(tableManagement.typeIs == "system" ? "" : (
                            "<div id='table-refresh-access'></div>" +
                            (details.sqlConnectionInfo.type == "External" ? "<div id='table-refresh-fields'></div>" : "")+//)) +
                        "</div>";

                    var sqlnode = document.querySelector("#table-sql-data");
                    sqlnode.classList.add("kv-nbsf");

                    let sqlconf = {
                        id: "sqldata",
                        dom: sqlnode,
                        page: 0,
                        pages: [{
                            title: null,
                            nav: false,
                            structure: [{
                                group: [
                                    [{
                                        label: "Type",
                                        type: "text",
                                        data: "type",
                                        disabled: true,
                                        validation: [],
                                        value: details.sqlConnectionInfo.type
                                    }, {
                                        label: "Server",
                                        type: "text",
                                        data: "server",
                                        disabled: true,
                                        validation: [],
                                        value: details.sqlConnectionInfo.server
                                    }, {
                                        label: "Port",
                                        type: "text",
                                        data: "Port",
                                        value: details.sqlConnectionInfo.port,
                                        validation: [],
                                        disabled: true,
                                    }, {
                                        label: "Database",
                                        type: "text",
                                        data: "database",
                                        disabled: true,
                                        validation: [],
                                        value: details.sqlConnectionInfo.database
                                    }, {
                                        label: "User",
                                        type: "text",
                                        data: "id",
                                        disabled: true,
                                        validation: [],
                                        value: details.sqlConnectionInfo.userId
                                    }, {
                                        label: "Password",
                                        type: "password",
                                        data: "password",
                                        disabled: true,
                                        validation: [],
                                        value: details.sqlConnectionInfo.userPwd
                                    }, {
                                        label: "Permissions",
                                        type: "text",
                                        data: "permissions",
                                        disabled: true,
                                        validation: [],
                                        value: details.sqlConnectionInfo.permissions
                                    }, ],
                                ]
                            }, ],
                            callback: function() {},
                        }, ],
                        onSubmit: function() {}
                    };
                    nbsf.init(sqlconf, 0, null);

                   //if (tableManagement.typeIs !== "system") {
                        var refreshBtn = {
                            id: "refreshBtn",
                            type: "icon",
                            icon: "kv-icon-refresh-ccw",
                            text: "Refresh Access",
                            color: "primary",
                            action: function() {
                                mo.fn.overlay.show({
                                    close: false,
                                    loading: true
                                });
                                const request = new XMLHttpRequest();
                                request.onreadystatechange = () => {
                                    if (request.readyState === 4) {
                                        mo.fn.slider.toggle();
                                        mo.fn.overlay.hide();
                                        cb();
                                    }
                                };
                                const formData = new FormData();
                                request.open("POST", "/builder/DataSource/refresh-permission?formId=" + details.formId);
                                request.send();
                            }
                        };
                        buttonComponent.init(el.querySelector('#table-refresh-access'), refreshBtn);

                        if (details.sqlConnectionInfo.type == "External") {
                            var refreshFieldsBtn = {
                                id: "refreshFieldBtn",
                                text: "Update Form Fields",
                                color: "info",
                                action: function() {
                                    mo.fn.overlay.show({
                                        close: false,
                                        loading: true
                                    });
                                    const request = new XMLHttpRequest();
                                    request.onreadystatechange = () => {
                                        if (request.readyState === 4) {
                                            if (request.status !== 200) {
                                                mo.fn.overlay.show({
                                                    close: false,
                                                    loading: false
                                                });
                                                mo.fn.notification.show("Unknown error", 3, 0, 5);
                                            } else {
                                                mo.fn.slider.toggle();
                                                mo.fn.overlay.hide();
                                                cb();
                                            }
                                        }
                                    };
                                    const formData = new FormData();
                                    formData.append("FormId", details.formId);
                                    formData.append("Provider", details.sqlConnectionInfo.provider);
                                    formData.append("Server_input", details.sqlConnectionInfo.server);
                                    formData.append("Server", details.sqlConnectionInfo.server);
                                    formData.append("Port", details.sqlConnectionInfo.port);
                                    formData.append("Database", details.sqlConnectionInfo.database);
                                    formData.append("User", details.sqlConnectionInfo.userId);
                                    formData.append("Pwd", details.sqlConnectionInfo.userPwd);
                                    formData.append("Table", details.sqlConnectionInfo.table);
                                    formData.append("UniqueIdentityField", details.sqlConnectionInfo.uniqueField);
                                    formData.append("UpdateFormFields", true);
                                    formData.append("X-Requested-With", "XMLHttpRequest");
                                    request.open("POST", "/builder/external-form-data-source/edit/save");
                                    request.send(formData);
                                }
                            };
                            buttonComponent.init(el.querySelector('#table-refresh-fields'), refreshFieldsBtn);
                        }
                    //}
                },

                ftpInit: function(cb) {
                    tableManagement.tables.tableEditor.currSearchValue = "";
                    tableManagement.tables.tableEditor.isAddFileActive = false;
                    tableManagement.tables.tableEditor.isImportDataActive = false;
                    var details = tableManagement.tables.tableEditor.details;
                    var el = tableManagement.tables.tableEditor.node.querySelector("#tableDetails");
                    el.innerHTML = "<div id='table-ftp-data'></div><div class='buttons' style='display:block;'><div id='table-ftp-template'></div></div><div>" +
                        "<div id='table-ftp-grid'></div>" + "<div id='table-ftp-import'></div>" + "" + "<div id='table-ftp-add-section'></div>" +
                        "<div id='table-ftp-importer-section'></div>" + "</div>";
                    var ftpnode = document.querySelector("#table-ftp-data");
                    ftpnode.classList.add("kv-nbsf");
                    let ftpconf = {
                        id: "sqldata",
                        dom: ftpnode,
                        page: 0,
                        pages: [{
                            title: null,
                            nav: true,
                            structure: [{
                                group: [
                                    [{
                                        label: "User",
                                        type: "text",
                                        data: "user",
                                        disabled: true,
                                        validation: [],
                                        value: details.ftpUser
                                    }, {
                                        label: "Password",
                                        type: "text",
                                        data: "password",
                                        disabled: true,
                                        validation: [],
                                        value: details.ftpPwd
                                    }, {
                                        label: "Url",
                                        type: "textarea",
                                        data: "url",
                                        disabled: true,
                                        validation: [],
                                        value: details.ftpUrl
                                    }, ],
                                ]
                            }, ],
                            callback: function() {},
                        }, ],
                        onSubmit: function() {}
                    };
                    nbsf.init(ftpconf, 0, null);
                    var tbl = el.querySelector("#table-ftp-grid");
                    var downloadsampleBtn = {
                        id: "downloadsampleBtn",
                        type: "icon",
                        icon: "kv-icon-download",
                        text: "Download Sample File",
                        borderless: true,
                        action: function() {
                            mo.fn.overlay.show({
                                close: false,
                                loading: true
                            });
                            const request = new XMLHttpRequest();
                            request.onreadystatechange = () => {
                                if (request.readyState === 4) {
                                    mo.fn.overlay.show({
                                        close: false,
                                        loading: false
                                    });
                                    const resp = JSON.parse(request.response);
                                    if (request.status == 400 && resp.Message) {
                                        mo.fn.overlay.show({
                                            close: false,
                                            loading: false
                                        });
                                        mo.fn.notification.show(resp.Message, 3, 0, 5);
                                    } else {
                                        var link = document.createElement("a");
                                        link.download = "template_" + tableManagement.dataEditor.id + ".xlsx";
                                        link.href = resp.Data.Url;
                                        link.click();
                                        delete link;
                                    }
                                }
                            };
                            const formData = new FormData();
                            formData.append("take", 10);
                            formData.append("skip", 0);
                            formData.append("page", 1);
                            formData.append("pageSize", 10);
                            formData.append("sort", JSON.stringify([{
                                "field": "['EntryId']",
                                "dir": "desc"
                            }]));
                            formData.append("formId", details.formId);
                            formData.append("GetHeadersOnly", "True");
                            formData.append("exportFormat", "excel");
                            request.open("POST", "/builder/form-data/preview/export");
                            request.send(formData);
                        }
                    };
                    buttonComponent.init(el.querySelector("#table-ftp-template"), downloadsampleBtn); /* TABLE */
                    let ftp_Config = {
                        dataSource: new kendo.data.DataSource({
                            data: tableManagement.tables.tableEditor.files,
                            filter: {
                                field: "name",
                                operator: "contains",
                                value: tableManagement.tables.tableEditor.currSearchValue
                            },
                            sort: {
                                field: "creationDate",
                                dir: "desc"
                            },
                            pageSize: 5,
                            page: 1
                        }),
                        columns: [{
                            field: "name",
                            title: "File",
                            width: "200px",
                            hidden: false,
                            filterable: true,
                        }, {
                            field: "size",
                            title: "Size, MB",
                            width: "80px",
                            hidden: false,
                            filterable: false,
                        }, {
                            field: "creationDate",
                            title: "Added",
                            width: "120px",
                            hidden: false,
                            template: function(d) {
                                return kv.utils.formatDate(d.creationDate);
                            }
                        }, ],
                        pageable: {
                            page: 1,
                            pageSize: 5,
                            refresh: true
                        },
                        filterable: true,
                        selectable: true,
                        sortable: true,
                        actions: [{
                            icon: "kv-icon-download",
                            tooltip: "Download",
                            action: function(e) {
                                var grid = $(tbl).data("kendoGrid");
                                var row = grid.dataItem($(this).closest("tr"));
                                var link = document.createElement("a");
                                link.href = "/builder/FormConfigurationWidget/tracked-file?formId=" + details.formId + "&trackedFile=" + row.name;
                                link.download = row.File;
                                link.click();
                            }
                        }],
                        height: "540",
                        toolbar_position: "bottom",
                        toolbar: [{
                            icon: "kv-icon-plus",
                            text: "Add New File",
                            action: function(e) {
                                if (tableManagement.tables.tableEditor.isAddFileActive) {
                                    return;
                                }
                                tableManagement.tables.tableEditor.isAddFileActive = true;
                                var confNode = el.querySelector("#table-ftp-add-section");
                                let uploader = {
                                    id: "uploader",
                                    dom: confNode,
                                    page: 0,
                                    pages: [{
                                        title: "",
                                        nav: false,
                                        structure: [{
                                            group: [
                                                [],
                                            ],
                                        }, ],
                                    }, {
                                        title: "",
                                        nav: true,
                                        structure: [{
                                            group: [
                                                [{
                                                    label: "Select File",
                                                    data: "FileName",
                                                    required: true,
                                                    type: "kUpload",
                                                    preventAutoUpload: true,
                                                    uploadConfig: {
                                                        formId: 0,
                                                        extensions: [".xlsx"],
                                                        maxFileSize: 100
                                                    }
                                                }],
                                            ]
                                        }, ],
                                        callback: function() {},
                                    }, ],
                                    onSubmit: function(page, currDS) {
                                        mo.fn.overlay.show({
                                            close: false,
                                            loading: true
                                        });
                                        const request = new XMLHttpRequest();
                                        request.onreadystatechange = () => {
                                            if (request.readyState === 4) {
                                                const resp = JSON.parse(request.response);
                                                if (request.status == 400 || !resp.success) {
                                                    mo.fn.overlay.show({
                                                        close: false,
                                                        loading: false
                                                    });
                                                    mo.fn.notification.show(resp.message, 3, 0, 5);
                                                } else {
                                                    confNode.innerHTML = "";
                                                    confNode.classList = "";
                                                    while (confNode.attributes.length > 0) {
                                                        confNode.removeAttribute(confNode.attributes[0].name);
                                                    }
                                                    confNode.id = "table-ftp-add-section";
                                                    tableManagement.tables.tableEditor.isAddFileActive = false;
                                                    tableManagement.tables.tableEditor.getFileList(function() {
                                                        var newds = new kendo.data.DataSource({
                                                            data: tableManagement.tables.tableEditor.files,
                                                            filter: {
                                                                field: "name",
                                                                operator: "contains",
                                                                value: tableManagement.tables.tableEditor.currSearchValue
                                                            },
                                                            sort: {
                                                                field: "creationDate",
                                                                dir: "desc"
                                                            },
                                                            pageSize: 5,
                                                            page: 1
                                                        });
                                                        mo.fn.overlay.show({
                                                            close: false,
                                                            loading: false
                                                        });
                                                        var grid = $(tbl).data("kendoGrid");
                                                        grid.setDataSource(newds);
                                                    });
                                                }
                                            }
                                        };
                                        var kendoUpload = $(el.querySelector("[data-name='FileName']")).data("kendoUpload");
                                        var files = kendoUpload.options.files;
                                        request.open("POST", "/builder/FormConfigurationWidget/add-data-source");
                                        const formData = new FormData();
                                        formData.append("FormId", details.formId);
                                        formData.append("X-Requested-With", "XMLHttpRequest");
                                        formData.append("file", files[0].rawFile);
                                        request.send(formData);
                                    },
                                    onPrev: function(currPage, prevPage, currDS) {
                                        confNode.innerHTML = "";
                                        for (let i = 0; i < confNode.attributes.length; i++) {
                                            confNode.removeAttribute(confNode.attributes[i].name);
                                        }
                                        confNode.id = "table-ftp-add-section";
                                        tableManagement.tables.tableEditor.isAddFileActive = false;
                                    },
                                };
                                var ds = {
                                    EntryId: 0,
                                    FileName: ""
                                };
                                uploader.dataset = ds;
                                nbsf.init(uploader, 1, ds);
                            }
                        }, {
                            icon: "kv-icon-upload-cloud",
                            text: "Import Data",
                            action: function(e) {
                                if (tableManagement.tables.tableEditor.isImportDataActive) {
                                    return;
                                }
                                var grid = $(tbl).data("kendoGrid");
                                var tRows = grid.select();
                                var selectedRow = grid.dataItem(tRows[0]);
                                if (selectedRow == null) {
                                    mo.fn.notification.show("Please select a file first", 3, 0, 5);
                                    return;
                                }
                                tableManagement.tables.tableEditor.isImportDataActive = true;
                                var confNode = el.querySelector("#table-ftp-importer-section");
                                let importer = {
                                    id: "importer",
                                    dom: confNode,
                                    page: 0,
                                    pages: [{
                                        title: "",
                                        nav: false,
                                        structure: [{
                                            group: [
                                                [],
                                            ],
                                        }, ],
                                    }, {
                                        title: "",
                                        nav: true,
                                        structure: [{
                                            group: [
                                                [{
                                                    label: "Import Option",
                                                    data: "ImportOption",
                                                    required: true,
                                                    type: "radio",
                                                    values: ["FlushAndFill", "Merge", ],
                                                    options: ["Flush and Fill", "Merge", ],
                                                }, {
                                                    label: "Unique field to merge",
                                                    data: "UniqueField",
                                                    required: true,
                                                    type: "select",
                                                    ignoreSelectOne: true,
                                                    values: tableManagement.tables.tableEditor.uniqueFields,
                                                    options: tableManagement.tables.tableEditor.uniqueFields,
                                                    filter: function(config) {
                                                        return config.dataset.ImportOption === "Merge";
                                                    }
                                                }],
                                            ]
                                        }, ],
                                        callback: function() {},
                                    }, ],
                                    onSubmit: function(page, currDS) {
                                        mo.fn.overlay.show({
                                            close: false,
                                            loading: true
                                        });
                                        const request = new XMLHttpRequest();
                                        request.onreadystatechange = () => {
                                            if (request.readyState === 4) {
                                                const resp = JSON.parse(request.response);
                                                if (request.status == 400 || !resp.success) {
                                                    mo.fn.overlay.show({
                                                        close: false,
                                                        loading: false
                                                    });
                                                    mo.fn.notification.show(resp.message, 3, 0, 5);
                                                } else { /* check progress here */
                                                    var interval = setInterval(function() {
                                                        const checkRequest = new XMLHttpRequest();
                                                        checkRequest.onreadystatechange = () => {
                                                            if (checkRequest.readyState === 4) {
                                                                const checkResp = JSON.parse(checkRequest.response);
                                                                if (checkRequest.status == 400 || !checkResp.success) {
                                                                    mo.fn.notification.show(checkResp.message, 3, 0, 5);
                                                                    mo.fn.overlay.show({
                                                                        close: false,
                                                                        loading: false
                                                                    });
                                                                    mo.fn.progress.hide();
                                                                    clearInterval(interval);
                                                                } else {
                                                                    if (checkResp.data.state == "error") {
                                                                        clearInterval(interval);
                                                                        mo.fn.overlay.show({
                                                                            close: false,
                                                                            loading: false
                                                                        });
                                                                        mo.fn.progress.hide();
                                                                        mo.fn.notification.show((checkResp.data.error || "Unknown error"), 3, 0, 5);
                                                                        return;
                                                                    }
                                                                    if (checkResp.data.state == "completedwithwarning") {
                                                                        clearInterval(interval);
                                                                        mo.fn.overlay.show({
                                                                            close: false,
                                                                            loading: false
                                                                        });
                                                                        mo.fn.progress.hide();
                                                                        mo.fn.notification.show("Not all rows were imported. " + checkResp.data.payload.fail + " errors encountered", 2, 0, 5);
                                                                        return;
                                                                    }
                                                                    if (checkResp.data.state == "completed" && checkResp.data.progress == 100) {
                                                                        clearInterval(interval);
                                                                        mo.fn.progress.hide();
                                                                        mo.fn.overlay.show({
                                                                            close: false,
                                                                            loading: false
                                                                        });
                                                                        mo.fn.notification.show((checkResp.data.status), 1, 0, 5);
                                                                        confNode.innerHTML = "";
                                                                        confNode.classList = "";
                                                                        while (confNode.attributes.length > 0) {
                                                                            confNode.removeAttribute(confNode.attributes[0].name);
                                                                        }
                                                                        confNode.id = "table-ftp-importer-section";
                                                                        tableManagement.tables.tableEditor.isImportDataActive = false;
                                                                        cb();
                                                                        return;
                                                                    }
                                                                    mo.fn.progress.show({
                                                                        progressPercent: checkResp.data.progress
                                                                    });
                                                                }
                                                            }
                                                        };
                                                        checkRequest.open("POST", "/builder/FormImportDataFileWidget/import-state?FormId=" + details.formId);
                                                        const checkData = new FormData();
                                                        checkData.append("uid", resp.data.uid);
                                                        checkRequest.send(checkData);
                                                    }, 3000);
                                                }
                                            }
                                        };
                                        request.open("POST", "/builder/FormImportDataFileWidget/import?formId=" + details.formId);
                                        const formData = new FormData();
                                        formData.append("FormId", details.formId);
                                        formData.append("importOption", currDS.ImportOption);
                                        formData.append("importUniqueField", currDS.UniqueField);
                                        formData.append("file", selectedRow.name);
                                        request.send(formData);
                                    },
                                    onPrev: function(currPage, prevPage, currDS) {
                                        confNode.innerHTML = "";
                                        for (let i = 0; i < confNode.attributes.length; i++) {
                                            confNode.removeAttribute(confNode.attributes[i].name);
                                        }
                                        confNode.id = "table-ftp-add-section";
                                        tableManagement.tables.tableEditor.isImportDataActive = false;
                                    },
                                };
                                var ds = {
                                    EntryId: 0,
                                    ImportOption: "",
                                    UniqueField: ""
                                };
                                importer.dataset = ds;
                                nbsf.init(importer, 1, ds);
                            }
                        }, ]
                    };
                    tableComponent.init(document.querySelector('#table-ftp-grid'), ftp_Config, function() {});
                    el.classList.remove("nbsf");
                },

                connInit: function(cb) {
                    var details = tableManagement.tables.tableEditor.details;
                    tableManagement.tables.tableEditor.node.querySelector("#tableDetails").innerHTML = "<div id='tableDetailsConn'></div>";
                    var el = tableManagement.tables.tableEditor.node.querySelector("#tableDetailsConn");

                    /*if (tableManagement.typeIs == "system") {
                        el.classList.add("kv-nbsf-readonly");
                    }*/

                    let conf = {
                        id: "editor",
                        dom: el,
                        page: 0,
                        pages: [{
                            title: "",
                            nav: /*tableManagement.typeIs == "user" ?*/ true,// : false,
                            structure: [{
                                group: [
                                    [{
                                        label: "SQL Provider",
                                        data: "Provider",
                                        type: "select",
                                        ignoreSelectOne: true,
                                        required: true,
                                        values: ["MSSQL", "RedShift"],
                                        options: ["MS SQL", "Amazon RedShift"],
                                        value: "",
                                        disabled: /*tableManagement.typeIs == "user" ?*/ false,// : true
                                    }, {
                                        label: "Server",
                                        type: "text",
                                        data: "Server",
                                        value: "",
                                        required: true,
                                        validation: ["minLen|3"],
                                        disabled: /*tableManagement.typeIs == "user" ?*/ false,// : true
                                    }, {
                                        label: "Port",
                                        type: "text",
                                        data: "Port",
                                        value: "",
                                        required: false,
                                        validation: ["isInteger"],
                                        disabled: /*tableManagement.typeIs == "user" ?*/ false,// : true
                                    }, {
                                        label: "Database",
                                        type: "text",
                                        data: "Database",
                                        value: "",
                                        required: true,
                                        validation: ["minLen|3"],
                                        disabled: /*tableManagement.typeIs == "user" ?*/ false,// : true
                                    }, {
                                        label: "User",
                                        type: "text",
                                        data: "User",
                                        value: "",
                                        required: true,
                                        validation: ["minLen|1"],
                                        disabled: /*tableManagement.typeIs == "user" ?*/ false,// : true
                                    }, {
                                        label: "Password",
                                        type: "password",
                                        data: "Password",
                                        value: "",
                                        required: false,
                                        validation: [],
                                        disabled: /*tableManagement.typeIs == "user" ?*/ false,// : true
                                    }, {
                                        label: "Table",
                                        type: "text",
                                        data: "Table",
                                        value: "",
                                        required: true,
                                        validation: ["minLen|1"],
                                        disabled: /*tableManagement.typeIs == "user" ?*/ false,// : true
                                    }, {
                                        label: "Unique Identity Field",
                                        type: "text",
                                        data: "UniqueIdentityField",
                                        value: "",
                                        required: true,
                                        validation: ["minLen|1"],
                                        disabled: /*tableManagement.typeIs == "user" ?*/ false,// : true
                                    }, /*{ label: "Update Form Fields", data: "UpdateFormFields", required: false, type: "toggle", values: [ "Y", "N", ], options: [ "Y", "N", ], }*/ ],
                                ]
                            }, ],
                        }, ],
                        onSubmit: function(page, currDS) {
                            mo.fn.overlay.show({
                                close: false,
                                loading: true
                            });
                            const checkConn = new XMLHttpRequest();
                            checkConn.onreadystatechange = () => {
                                if (checkConn.readyState === 4) {
                                    const resp = checkConn.response;
                                    if (checkConn.status !== 200 || resp !== "true") {
                                        mo.fn.overlay.show({
                                            close: false,
                                            loading: false
                                        });
                                        mo.fn.notification.show("Connection to the database failed!", 3, 0, 5);
                                    } else {
                                        const formData = new FormData();
                                        formData.append("FormId", currDS.FormId);
                                        formData.append("Provider", currDS.Provider);
                                        formData.append("Server_input", currDS.Server);
                                        formData.append("Server", currDS.Server);
                                        formData.append("Port", currDS.Port);
                                        formData.append("Database", currDS.Database);
                                        formData.append("User", currDS.User);
                                        formData.append("Pwd", currDS.Password);
                                        formData.append("Table", currDS.Table);
                                        formData.append("UniqueIdentityField", currDS.UniqueIdentityField);
                                        formData.append("UpdateFormFields", false);
                                        formData.append("X-Requested-With", "XMLHttpRequest");
                                        const request = new XMLHttpRequest();
                                        request.onreadystatechange = () => {
                                            if (request.readyState === 4) {
                                                if (request.status !== 200) {
                                                    mo.fn.overlay.show({
                                                        close: false,
                                                        loading: false
                                                    });
                                                    mo.fn.notification.show("Unknown error", 3, 0, 5);
                                                } else {
                                                    mo.fn.slider.toggle();
                                                    mo.fn.overlay.hide();
                                                    cb();
                                                }
                                            }
                                        };
                                        request.open("POST", "/builder/external-form-data-source/edit/save");
                                        request.send(formData);
                                    }
                                }
                            };
                            checkConn.open("POST", "/builder/data-sources/test");
                            const cn = {
                                provider: currDS.Provider,
                                database: currDS.Database,
                                server: currDS.Server,
                                port: currDS.Port,
                                driver: null,
                                user: currDS.User,
                                pwd: currDS.Password,
                                table: currDS.Table
                            };
                            const cData = new FormData();
                            cData.append("cn", JSON.stringify(cn));
                            checkConn.send(cData);
                        }
                    };
                    var ds = {
                        FormId: details.formId,
                        Provider: details.sqlConnectionInfo.provider,
                        Server: details.sqlConnectionInfo.server,
                        Port: details.sqlConnectionInfo.port,
                        Database: details.sqlConnectionInfo.database,
                        User: details.sqlConnectionInfo.userId,
                        Password: details.sqlConnectionInfo.userPwd,
                        Table: details.sqlConnectionInfo.table,
                        UniqueIdentityField: details.sqlConnectionInfo.uniqueField,
                        UpdateFormFields: "N",
                    };
                    conf.dataset = ds;
                    tableManagement.tables.tableEditor.conf = { ...conf
                    };
                    nbsf.init(conf, 0, ds);
                },

                getUniqueFields: function(cb) {
                    var details = tableManagement.tables.tableEditor.details;
                    var filter = {
                        field: "FormId",
                        operator: "eq",
                        value: details.formId
                    };
                    var ds = new kendo.data.DataSource({
                        type: "rfb-v2",
                        transport: {
                            read: {
                                url: `/form/data-set-provider/v2/${kv.utils.getFormId(45)}/KV_UniqueTableColumns/kendo/data/search`,
                                type: "POST"
                            },
                        },
                        schema: {
                            model: {
                                id: "Id",
                                fields: {}
                            }
                        },
                        serverFiltering: true,
                        filter: filter,
                        serverSorting: true,
                        sort: {
                            field: "Id",
                            dir: "asc"
                        }
                    }); /* mo.fn.overlay.show({close:false, loading: true}); */
                    ds.read().then(function() { /* mo.fn.overlay.hide(); */
                        var data = ds.view();
                        const result = [];
                        tableManagement.tables.tableEditor.uniqueFields = [...data.map(el => el.Name)];
                    });
                },

                getFileList: function(cb) {
                    var details = tableManagement.tables.tableEditor.details;
                    var ds = new kendo.data.DataSource({
                        type: "rfb-v2",
                        transport: {
                            read: {
                                url: "/builder/FormConfigurationWidget/tracked-files",
                                data: {
                                    formId: details.formId,
                                    page: 1,
                                    pageSize: 1000,
                                },
                                type: "POST"
                            },
                        },
                        schema: {
                            model: {
                                id: "name",
                                fields: {}
                            }
                        },
                        serverFiltering: true,
                    }); /* mo.fn.overlay.show({close:false, loading: true}); */
                    ds.read().then(function() { /* mo.fn.overlay.hide(); */
                        var data = ds.view();
                        const result = [];
                        tableManagement.tables.tableEditor.files = [...data];
                        cb();
                    });
                },
            },

        },

        dataEditor: {
            columns: [],
            id: "",
            currItm: null,
            tabs: {},

            init: function(table) {
                tableManagement.dataEditor.columns = [];
                tableManagement.dataEditor.currItm = null;
                tableManagement.dataEditor.id = table.id.split(":")[0];
                mo.fn.overlay.show({
                    loading: true,
                    close: false
                });
                const cb = function() {
                    var dataNode = tableManagement.holder.querySelector(".table-management-data");
                    var mainNode = tableManagement.holder.querySelector(".table-management-main");
                    dataNode.innerHTML = "<div class='table-data-row'>" + "<div id='data-back-button'></div>" + "<div id='table-rowdata-details'></div>" +
                        "<div id='table-data-tabs'></div>" + 
                        "<div id='table-data-grid'></div>" +
                        "<div id='rules-data-grid'></div>" + "</div>";
                    var backBtn = {
                        id: "data-go-back-button",
                        type: "icon",
                        icon: "kv-icon-arrow-left",
                        text: "Back",
                        size: "md",
                        borderless: true,
                        action: function() {
                            mainNode.classList.toggle("kv-hide");
                            dataNode.classList.toggle("kv-hide");
                            dataNode.innerHTML = "";
                        }
                    };
                    buttonComponent.init(dataNode.querySelector('#data-back-button'), backBtn);
                    var cardConfig = {
                        header: true,
                        id: table.id + "-itm",
                        title: "<h1>" + table.extraData.name + "</h1>" + "<h3>Overview (FORM_DATA_TABLE_" + table.id.split(":")[0] + ")</h3>",
                        description: table.extraData.details ? (table.extraData.details.description ? table.extraData.details.description : "N/A") : "N/A",
                        updatedDate: table.extraData.details ? (table.extraData.details.modified ? kv.utils.formatDate(table.extraData.details.modified) : "N/A") : "N/A",
                        updatedBy: table.extraData.details ? (table.extraData.details.modifiedBy ? table.extraData.details.modifiedBy : "N/A") : "N/A",
                        content: function(node) {},
                        action: function(node) {},
                        actions: null
                    };
                    cardComponent.init(dataNode.querySelector("#table-rowdata-details"), cardConfig, function() {});
                    var tabHolder = dataNode.querySelector('#table-data-tabs');
                    tabHolder.innerHTML += '<div class="table-tabs"></div>';
                    tabHolder.innerHTML += '<div class="table-tab-data"></div>';
                    tabHolder.innerHTML += '<div class="table-tab-rules"></div>';
                    tableManagement.dataEditor.tabsInit(dataNode, table);
                    mainNode.classList.toggle("kv-hide");
                    dataNode.classList.toggle("kv-hide");
                };
                tableManagement.dataEditor.getColumns(tableManagement.dataEditor.id, cb);
            },

            tabsInit: function(holder, table) {
                var config = {
                    tabs: [{
                            label: "Table Data",
                            id: "tbData",
                            active: false,
                            click: function(e) {
                                tableManagement.dataEditor.initGrid(holder, table);
                            },
                        },
						{
                            label: "Authorization",
                            id: "ruleTab",
                            active: false,
                            click: function(e) {
                                widgets.rulesGrid.init(document.querySelector('.widget-authorization'));
                            }
                        },
                    ],
                    skipContainers: true,
                };

                let el = holder.querySelector('.table-tabs');
                tableManagement.dataEditor.tabs = { ...tabs
                };
                tableManagement.dataEditor.tabs.init(el, config);
            },

            initGrid: function(node, table) {
                var tableData = node.querySelector("#table-data-grid");
                tableData.classList.remove("kv-hide");
                var rulesGrid = node.querySelector("#rules-grid");
                rulesGrid.classList.add("kv-hide");

                var tbl = node.querySelector("#table-data-grid");
                let tabledataConfig = {
                    noRecords: {
                        template: "<div style='margin-top:100px; text-align: center;'> No data available </div>"
                    },
                    dataSource: tableManagement.dataEditor.dataSet(),
                    columns: tableManagement.dataEditor.columns,
                    editable: "inline",
                    //editable: { mode: "inline", create: true, update: true, destroy: true },

                    columnMenu: {
                        filterable: true
                    },
                    reorderable: true,
                    pageable: {
                        buttonCount: 3,
                        pageSize: 5,
                        pageSizes: [5, 10, 20],
                        refresh: true
                    },
                    filterable: true,
                    scrollable: true,
                    resizable: true,
                    sortable: true,
				  	export: true,
                    actions: /*tableManagement.typeIs == "user" ?*/ [
					  {
                            icon: "kv-icon-trigger",
                            tooltip: "Trigger",
                            id: "trigger_icon",
                            tooltipPosition: "right",
                            action: function(e) {
                                var grid = $(tbl).data("kendoGrid");
                                var row = $(this).closest("tr");
                                tableManagement.dataEditor.workflowTrigger(e, function() {
                                    grid.dataSource.read();
                                    grid.refresh();
                                });
                            },
                            visibility: function(rowObj) {
                                return true;
                            }
                        },


                        {
                            icon: "kv-icon-edit",
                            tooltip: "Edit",
                            id: "edit_icon",
                            tooltipPosition: "right",

                            action: function(e) {
                                var grid = $(tbl).data("kendoGrid");
                                grid.refresh();
                                var grid = $(tbl).data("kendoGrid");
                                var row = tbl.querySelector('tr[data-uid="' + e.uid + '"]');
                                grid.editRow(row);
                                row.classList.add("kv-active-editable-row");
							  	tableManagement.dataEditor.currItm = grid.dataItem(row);
                            },

                            visibility: function(rowObj) {
                                return true;
                            }
                        },

                        {
                            icon: "kv-icon-x",
                            tooltip: "Cancel",
                            tooltipPosition: "right",
                            id: "cancel_icon",
                            action: function(e) {
                                var grid = $(tbl).data("kendoGrid");
                                var row = tbl.querySelector('tr[data-uid="' + e.uid + '"]');
                                row.classList.remove("kv-active-editable-row");
                                grid.cancelRow();
                                grid.dataSource.read();
                                grid.refresh();
                                if (tableManagement.dataEditor.currItm.EntryId !== 0) {


                                }
                                tableManagement.dataEditor.currItm = null;
                            },
                            visibility: function(rowObj) {
                                return true;
                            }
                        },

                        {
                            icon: "kv-icon-save",
                            tooltip: "Save",
                            tooltipPosition: "right",
                            id: "save_icon",
                            action: function(e) {
                                var grid = $(tbl).data("kendoGrid");
                                var row = tbl.querySelector('tr[data-uid="' + e.uid + '"]');
                                var el = grid.dataItem(row);
                                if (!!el) {
                                    mo.fn.overlay.show({
                                        close: false,
                                        loading: true
                                    });
                                    const request = new XMLHttpRequest();
                                    request.onreadystatechange = () => {
                                        if (request.readyState === 4) {
                                            mo.fn.overlay.hide();
                                            if (request.status == 400 || !request.response) {
                                                mo.fn.modal.show({
                                                    close: false,
                                                    ctaLabel: "OK",
                                                    title: "Error",
                                                    content: "Unable to save changes",
                                                });
                                            } else {
                                                grid.cancelRow();
                                                if (tableManagement.dataEditor.currItm.EntryId !== 0) {
                                                    row.classList.remove("kv-active-editable-row");
                                                }
                                                tableManagement.dataEditor.currItm = null;
                                                grid.dataSource.read();
                                                grid.refresh();
                                            }
                                        }
                                    };
                                    const formData = new FormData();
                                    formData.append("models", JSON.stringify([el]));
                                    request.open(tableManagement.dataEditor.currItm.EntryId === 0 ? "POST" : "PUT", '/builder/form-data/preview?formId=' + tableManagement.dataEditor.id);
                                    request.send(formData);
                                }
                            },

                            visibility: function(rowObj) {
                                return true;
                            }
                        },

                        {
                            icon: "kv-icon-trash",
                            tooltip: "Delete",
                            tooltipPosition: "right",
                            id: "delete_icon",
                            action: function(e) {
                                const uniqueField = tableManagement.dataEditor.columns.find(c => !c.editable && c.title !== "Actions");
                                var grid = $(tbl).data("kendoGrid");
                                var row = tbl.querySelector('tr[data-uid="' + e.uid + '"]');

                                var el = e;
                                if (!!el) {
                                    mo.fn.modal.show({
                                        close: true,
                                        ctaLabel: "Confirm",
                                        closeLabel: "Cancel",
                                        title: "Delete row",
                                        content: "Are you sure what you want delete row with Id " + el[uniqueField.field],
                                        ctaCallback: function() {
                                            mo.fn.overlay.show({
                                                close: false,
                                                loading: true
                                            });
                                            const request = new XMLHttpRequest();
                                            request.onreadystatechange = () => {
                                                if (request.readyState === 4) {
                                                    mo.fn.overlay.hide();
                                                    const resp = JSON.parse(request.response);
                                                    if (request.status == 400 && resp.Message) {
                                                        mo.fn.notification.show(resp.Message, 3, 0, 5);
                                                    } else {
                                                        mo.fn.modal.hide();
                                                        grid.dataSource.read();
                                                        grid.refresh();
                                                    }
                                                }
                                            };
                                            const formData = new FormData();
                                            formData.append("id", el[uniqueField.field]);
                                            formData.append("formId", tableManagement.dataEditor.id);
                                            request.open("DELETE", "/builder/form-data/preview");
                                            request.send(formData);
                                        }
                                    });
                                }
                            },
                            visibility: function(rowObj) {
                                return true;
                            }
                        },

                    ],// : [],
                    actionposition: "start",
                    height: "540",
                    toolbar: /*tableManagement.typeIs == "user" ?*/ [{
                        icon: "kv-icon-plus",
                        text: "Add Record",
                        action: function() {
                            var grid = $(tbl).data("kendoGrid");
                            tableManagement.dataEditor.currItm = {
                                EntryId: 0
                            };
                            grid.addRow();
                            var row = $(tbl).find(".k-grid-edit-row");

                            row.find("[data-id='edit_icon']").toggleClass("kv-hide");
                            row.find("[data-id='delete_icon']").toggleClass("kv-hide");
                            row.find("[data-id='save_icon']").toggleClass("kv-hide");
                            row.find("[data-id='cancel_icon']").toggleClass("kv-hide");

                        }
                    },]// : [],
                };
                tableComponent.init(tbl, tabledataConfig, function() {});
            },

            rulesGrid: {
                init: function(node) {
                    var tableData = node.querySelector("#table-data-grid");
                    tableData.classList.add("kv-hide");
                    var rulesGrid = node.querySelector("#rules-grid");
                    rulesGrid.classList.remove("kv-hide");
                }
            }

            dataSet: function() {
                var model = {};
                tableManagement.dataEditor.columns.map(c => {
                    if (!!!["Actions", "Created", "Modified", "CreatedBy", "ModifiedBy"].find(i => i == c.title)) model[c.title] = {
                        editable: c.editable,
                        type: c.type
                    };
                });
                model = { ...model,
                    Created: {
                        editable: false,
                        type: "date"
                    },
                    CreatedBy: {
                        editable: false,
                        type: "string"
                    },
                    Modified: {
                        editable: false,
                        type: "date"
                    },
                    ModifiedBy: {
                        editable: false,
                        type: "string"
                    }
                };
                const uniqueField = tableManagement.dataEditor.columns.find(c => !c.editable && c.title !== "Actions");

                var ds = new kendo.data.DataSource({
                    type: "rfb-v2",
                    transport: {
                        read: {
                            url: "/builder/form-data/preview",
                            type: "GET",
                            data: {
                                formId: tableManagement.dataEditor.id,
                                take: 10,
                                skip: 0,
                                page: 1,
                                pageSize: 10,
                                sort: tableManagement.dataEditor.columns.length > 0 ? [{
                                    "field": uniqueField.title,
                                    "dir": "desc"
                                }] : []
                            },
                        },
                    },
                    schema: {
                        model: {
                            id: tableManagement.dataEditor.columns.length > 0 ? uniqueField.title : null,
                            fields: model,
                        },
                    }, //editable: "inline",


                    serverFiltering: true,
                    serverSorting: true,
                    sort: {
                        field: tableManagement.dataEditor.columns.length > 0 ? uniqueField.title : null,
                        dir: "desc"
                    },
                    serverPaging: true,
                    pageSize: 10
                });
                return ds;
            },

            getColumns: function(id, cb) {
                mo.fn.overlay.show({
                    close: false,
                    loading: true
                });
                const request = new XMLHttpRequest();
                request.onreadystatechange = () => {
                    if (request.readyState === 4) {
                        mo.fn.overlay.hide();
                        if (request.status !== 200 || !!!request.response) {
                            mo.fn.modal.show({
                                close: false,
                                ctaLabel: "OK",
                                title: "Error",
                                content: "Unable to fetch columns for form " + id,
                            });
                        } else {
                            function removeBracketsFromText(arr) {
                                if (!Array.isArray(arr)) {
                                    return arr;
                                }
                                for (let i = 0; i < arr.length; i++) {
                                    const item = arr[i];
                                    if (item && typeof item === 'object' && 'Text' in item) {
                                        const textValue = item['Text'];
                                        if (typeof textValue === 'string') {
                                            item['Text'] = textValue.replace(/\([^)]*\)/g, '');
                                        }
                                    }
                                    if (item && 'Items' in item && Array.isArray(item['Items'])) {
                                        item['Items'] = removeBracketsFromText(item['Items']);
                                    }
                                }
                                return arr;
                            }
                            var colsGroups = removeBracketsFromText(JSON.parse(request.response));
                            const data = tableManagement.columnEditor.processColumnList(colsGroups, 0, "", "");
                            var uniqueSystemFields = data.filter(c => c.IsUnique && c.Group == "System");
                            if (!uniqueSystemFields || !uniqueSystemFields.length) {
                                uniqueSystemFields = data.filter(c => c.Group == "System");
                            }
                            const cols = [];
                            uniqueSystemFields.map(c => {
                                cols.push({
                                    field: c.Name,
                                    title: c.Name,
                                    hidden: false,
                                    width: "120px",
                                    filterable: true,
                                    editable: false,
                                });
                            });
                            data.map(d => {
                                if (!!!uniqueSystemFields.find(u => u.Name == d.Name)) { /* if(d.Name !== "EntryId" && !(d.IsUnique && d.Group == "System")) { */
                                    const isDate = d.ColumnType == "date-time";
                                    const isNumber = d.ColumnType == "float";
                                    const name = d.Name;
                                    var column = {
                                        field: name,
                                        title: name,
                                        hidden: false,
                                        width: "150px",
                                        type: isDate ? "date" : isNumber ? "number" : "string",
                                        filterable: true,
                                    };
                                    cols.push(column);
                                    if (isDate || isNumber) {
                                        column.template = function(data) {
                                            if (!data[name]) return "";
                                            if (isDate) {
                                                var d = new Date();
                                                var date = new Date(new Date(data[name]) - new Date(d.getTimezoneOffset() * 60 * 1000)).toLocaleString();
                                                date = date.replace(",", "") || "-";
                                                return date;
                                            }
                                            return data[name];
                                        }
                                    }
                                }
                            });
                            tableManagement.dataEditor.columns = [...cols];
                            cb();
                        }
                    }
                };
                request.open("POST", "/builder/FormFieldsWidget/get-data?FormId=" + id);
                request.send();
            },

            workflowTrigger: function(row, cb) {
                const uniqueField = tableManagement.dataEditor.columns.find(c => !c.editable && c.title !== "Actions");
                var id = row[uniqueField.field];
                mo.fn.modal.show({
                    close: true,
                    title: "#" + id + ": Trigger workflow",
                    noButtons: true,
                    content: "<div id='table-workflow-description'>Warning! For this record will be triggered a workflow process, all data will be processed as usual. Use only test records</div>" + "<div id='table-workflow-form' style='width: 80%; margin: 0 auto;'></div>",
                    contentCallback: function() {
                        var node = document.querySelector("#table-workflow-form");
                        node.classList.add("kv-nbsf");
                        let conf = {
                            id: "workflow",
                            dom: node,
                            page: 0,
                            pages: [{
                                title: "",
                                nav: true,
                                structure: [{
                                    group: [
                                        [{
                                            label: "Workflow Type",
                                            data: "Type",
                                            type: "select",
                                            ignoreSelectOne: true,
                                            values: ["OnCreate", "OnChange", "Scheduler"],
                                            options: ["OnCreate", "OnChange", "Scheduler"],
                                            required: true,
                                        }, ],
                                    ]
                                }, ],
                            }, ],
                            onSubmit: function(page, currDS) {
                                mo.fn.overlay.show({
                                    close: false,
                                    loading: true
                                });
                                const request = new XMLHttpRequest();
                                request.open("POST", "/builder/workflow/" + tableManagement.dataEditor.id + "/trigger");
                                const formData = new FormData();
                                request.onreadystatechange = () => {
                                    if (request.readyState === 4) {
                                        mo.fn.overlay.hide();
                                        mo.fn.modal.hide();
                                        cb();
                                    }
                                };
                                formData.append("EntryId", id);
                                formData.append("FormId", tableManagement.dataEditor.id);
                                formData.append("Type", currDS.Type);
                                request.send(formData);
                            }
                        };
                        var ds = {
                            Type: "OnCreate"
                        };
                        conf.dataset = ds;
                        nbsf.init(conf, 0, ds);
                    }
                });
            },

        },

        columnEditor: {

            columns: [],
            groups: [],
            id: "",
            currTab: "Custom",
            conf: null,
            search: null,
            tabs: null,
            currSearchValue: "",

            init: function(table) {
                tableManagement.columnEditor.columns = [];
                tableManagement.columnEditor.groups = [];
                tableManagement.columnEditor.currTab = "SOR";
                tableManagement.columnEditor.conf = null;
                tableManagement.columnEditor.search = null;
                tableManagement.columnEditor.tabs = null;
                tableManagement.columnEditor.currSearchValue = "";
                tableManagement.columnEditor.id = table.id.split(":")[0];
                mo.fn.overlay.show({
                    loading: true,
                    close: false
                });
                const cb = function() {
                    var dataNode = tableManagement.holder.querySelector(".table-management-data");
                    var mainNode = tableManagement.holder.querySelector(".table-management-main");
                    dataNode.innerHTML = "<div class='table-data-row'>" + "<div id='table-col-back'></div>" + "<div id='table-data-details'></div>" +
                        "<div id='table-data-search' class='search-long' style='display: none;'></div>" + "<div id='table-data-grid'></div>" + "</div>";
                    var backBtn = {
                        id: "column-back-button",
                        type: "icon",
                        icon: "kv-icon-arrow-left",
                        text: "Back",
                        size: "md",
                        borderless: true,
                        action: function() {
                            mainNode.classList.toggle("kv-hide");
                            dataNode.classList.toggle("kv-hide");
                            dataNode.innerHTML = "";
                        }
                    };
                    buttonComponent.init(dataNode.querySelector('#table-col-back'), backBtn);
                    let cardConfig = {
                        header: true,
                        id: table.id + "-itm",
                        title: "<h1>" + table.extraData.name + "</h1>" + "<h3>Overview (FORM_DATA_TABLE_" + table.id.split(":")[0] + ")</h3>",
                        description: table.extraData.details ? (table.extraData.details.description ? table.extraData.details.description : "N/A") : "N/A",
                        updatedDate: table.extraData.details ? (table.extraData.details.modified ? kv.utils.formatDate(table.extraData.details.modified) : "N/A") : "N/A",
                        updatedBy: table.extraData.details ? (table.extraData.details.modifiedBy ? table.extraData.details.modifiedBy : "N/A") : "N/A",
                        content: function(node) {},
                        action: function(node) {},
                        actions: null
                    };
                    cardComponent.init(dataNode.querySelector("#table-data-details"), cardConfig, function() {});
                    tableManagement.columnEditor.gridInit(dataNode, table); /* tableManagement.columnEditor.searchInit(dataNode); */
                    var tbl = dataNode.querySelector("#table-data-grid");
                    var grid = $(tbl).data("kendoGrid");
                    mainNode.classList.toggle("kv-hide");
                    dataNode.classList.toggle("kv-hide");
                };
                tableManagement.columnEditor.getColumns(tableManagement.columnEditor.id, cb);
            },

            gridInit: function(node, table) {
                var tbl = node.querySelector("#table-data-grid");
                let tabledataConfig = {
                    noRecords: {
                        template: "<div style='margin-top:100px; text-align: center'> No data available </div>"
                    },
                    dataSource: tableManagement.columnEditor.dataSet(),
                    columns: [{
                        field: "Name",
                        template: function(d) {
                            return d.Name.replace(/\([^)]*\)/g, '');
                        },
                        title: "Name",
                        hidden: false,
                        filterable: true,
                    }, {
                        field: "ColumnType",
                        title: "Type",
                        width: "120px",
                        hidden: false,
                        filterable: true,
                    }, {
                        field: "ColumnSize",
                        title: "Size",
                        width: "120px",
                        hidden: false,
                        filterable: true,
                    }, {
                        field: "Category",
                        title: "Category",
                        hidden: false,
                        width: "150px",
                        filterable: true,
                    }, {
                        field: "IsUnique",
                        title: "Unique",
                        width: "120px",
                        hidden: false,
                        filterable: true,
                        template: function(d) {
                            return d.IsUnique ? "Y" : "N";
                        },
                        filterable: false,
                    }, ],
                    pageable: {
                        buttonCount: 3,
                        pageSize: 5,
                        pageSizes: [5, 10, 20],
                        refresh: false
                    },
                    filterable: true,
                    scrollable: true,
                    resizable: true,
                    sortable: true,
                    actions: /*tableManagement.typeIs == "user" ?*/ [{
                        icon: "kv-icon-edit",
                        tooltip: "Edit",
                        action: function(e) {
                            var grid = $(tbl).data("kendoGrid");
                            tableManagement.columnEditor.editorInit(e, function() {
                                tableManagement.columnEditor.getColumns(tableManagement.columnEditor.id, function() {
                                    var grid = $(tbl).data("kendoGrid");
                                    grid.setDataSource(tableManagement.columnEditor.dataSet());
                                });
                            });
                        },
                        visibility: function(rowObj) {
                            return (rowObj.Group !== "System" && !!["date-time", "float", "string"].find(st => st === rowObj.ColumnType));
                        }
                    }, {
                        icon: "kv-icon-trash",
                        tooltip: "Delete",
                        action: function(e) {
                            var grid = $(tbl).data("kendoGrid");
                            var el = e;
                            if (!!el) {
                                mo.fn.modal.show({
                                    close: true,
                                    ctaLabel: "Confirm",
                                    closeLabel: "Cancel",
                                    title: "Delete column",
                                    content: "Are you sure what you want delete column " + el.Name,
                                    ctaCallback: function() {
                                        mo.fn.overlay.show({
                                            close: false,
                                            loading: true
                                        });
                                        const request = new XMLHttpRequest();
                                        request.onreadystatechange = () => {
                                            if (request.readyState === 4) {
                                                mo.fn.overlay.hide();
                                                if (request.status == 400 && request.response !== "<text>ok</text>") {
                                                    mo.fn.notification.show("Error", 3, 0, 5);
                                                } else {
                                                    mo.fn.modal.hide();
                                                    tableManagement.columnEditor.getColumns(tableManagement.columnEditor.id, function() {
                                                        grid.setDataSource(tableManagement.columnEditor.dataSet());
                                                    });
                                                }
                                            }
                                        };
                                        request.open("DELETE", "/builder/FormFieldsWidget/fields/" + el.FieldId);
                                        request.send();
                                    }
                                })
                            }
                        },
                        visibility: function(rowObj) {
                            return (rowObj.Group !== "System" && !!["date-time", "float", "string"].find(st => st === rowObj.ColumnType));
                        }
                    } 
					/* { title: "Actions", width: "110px", attributes: { class: "cta" }, template: function(d) { var icons = ""; if (d.Group !== "System") { icons  += !!["date-time", "float", "string"].find(st => st === d.ColumnType) ? "<a class='table-data-edit edit_icon'></a>" : ""; icons  += "<a class='table-data-remove delete_icon'></a>"; } return icons; }, sortable: false, }, */
					],// : [],
                    height: "540",
                    toolbar: /*tableManagement.typeIs == "user" ?*/ [{
                        icon: "kv-icon-plus",
                        text: "Add Column",
                        action: function(e) {
                            tableManagement.columnEditor.editorInit(null, function() {
                                tableManagement.columnEditor.getColumns(tableManagement.columnEditor.id, function() {
                                    var grid = $(tbl).data("kendoGrid");
                                    grid.setDataSource(tableManagement.columnEditor.dataSet());
                                });
                            });
                        }
                    }, ],// : [],
                    tabs: {
                        tabs: [{
                            label: "Custom",
                            id: "Custom",
                            active: true,
                            click: function(e) {
                                var grid = $(tbl).data("kendoGrid");
                                tableManagement.columnEditor.currTab = "Custom";
                                node.querySelector("#table-data-grid-tool-0-btn") ? node.querySelector("#table-data-grid-tool-0-btn").classList.remove("kv-hide") : '';
                                grid.setDataSource(tableManagement.columnEditor.dataSet());
                                grid.showColumn("Category");
                            },
                        }, {
                            label: "SOR",
                            id: "SOR",
                            click: function(e) {
                                var grid = $(tbl).data("kendoGrid");
                                tableManagement.columnEditor.currTab = "SOR";
                                node.querySelector("#table-data-grid-tool-0-btn") ? node.querySelector("#table-data-grid-tool-0-btn").classList.remove("kv-hide") : '';
                                grid.setDataSource(tableManagement.columnEditor.dataSet());
                                grid.hideColumn("Category");
                            },
                        }, {
                            label: "SSO",
                            id: "SSO",
                            click: function(e) {
                                var grid = $(tbl).data("kendoGrid");
                                tableManagement.columnEditor.currTab = "SSO";
                                node.querySelector("#table-data-grid-tool-0-btn") ? node.querySelector("#table-data-grid-tool-0-btn").classList.remove("kv-hide") : '';
                                grid.setDataSource(tableManagement.columnEditor.dataSet());
                                grid.hideColumn("Category");
                            },
                        }, {
                            label: "System",
                            id: "System",
                            click: function(e) {
                                var grid = $(tbl).data("kendoGrid");
                                tableManagement.columnEditor.currTab = "System";
                                node.querySelector("#table-data-grid-tool-0-btn") ? node.querySelector("#table-data-grid-tool-0-btn").classList.add("kv-hide") : '';
                                grid.setDataSource(tableManagement.columnEditor.dataSet());
                                grid.hideColumn("Category");
                            },
                        }, ],
                        skipContainers: true,
                    },
                };
                tableComponent.init(tbl, tabledataConfig, function() {});
            },

            dataSet: function() {
                const filters = [];
                if (tableManagement.columnEditor.currSearchValue.length > 2) {
                    filters.push({
                        field: "Name",
                        operator: "contains",
                        value: tableManagement.columnEditor.currSearchValue
                    });
                }
                filters.push({
                    field: "Group",
                    operator: "eq",
                    value: tableManagement.columnEditor.currTab
                });
                var ds = new kendo.data.DataSource({
                    data: tableManagement.columnEditor.columns,
                    filter: {
                        logic: "and",
                        filters: filters
                    },
                    page: 1,
                    pageSize: 5
                });
                return ds;
            },

            getColumns: function(id, cb) {
                mo.fn.overlay.show({
                    close: false,
                    loading: true
                });
                const request = new XMLHttpRequest();
                request.onreadystatechange = () => {
                    if (request.readyState === 4) {
                        mo.fn.overlay.hide();
                        if (request.status !== 200 || !!!request.response) {
                            mo.fn.modal.show({
                                close: false,
                                ctaLabel: "OK",
                                title: "Error",
                                content: "Unable to fetch columns for form " + id,
                            });
                        } else {
                            var colsGroups = JSON.parse(request.response);
                            tableManagement.columnEditor.groups = [];
                            const cols = tableManagement.columnEditor.processColumnList(colsGroups, 0, "", "");
                            tableManagement.columnEditor.columns = [...cols];
                            cb();
                        }
                    }
                };
                request.open("POST", "/builder/FormFieldsWidget/get-data?FormId=" + id);
                request.send();
            },

            searchInit: function(node) {
                let el = node.querySelector("#table-data-search");
                const config = {
                    searchBar: {
                        enabled: true,
                        placeholder: "Enter value to search",
                        value: tableManagement.columnEditor.currSearchValue,
                        onChange: function(e) {
                            tableManagement.columnEditor.currSearchValue = e.target.value;
                            var tbl = tableManagement.holder.querySelector("#table-data-grid");
                            var grid = $(tbl).data("kendoGrid");
                            grid.setDataSource(tableManagement.columnEditor.dataSet());
                        },
                    },
                };
                tableManagement.columnEditor.search = { ...searchWidget
                };
                tableManagement.columnEditor.search.init(el, config);
            },

            processColumnList: function(cols, lvl, group, category) {
                const result = [];
                cols.map(c => {
                    const cType = c.ExtraData.Type[0];
                    const t = ["string", "float", "integer", "date-time", "identity"].find(t => t == cType);
                    const sizeMatches = c.Text.match(/\(([^)] + )\)/);
                    if (!!t) {
                        result.push({
                            FieldId: c.Id,
                            Name: c.Text.replace(/\(. + \)/, ""),
                            Group: group,
                            Category: category,
                            ColumnType: cType,
                            ColumnSize: !!sizeMatches && !!sizeMatches.length ? sizeMatches[1] : null,
                            IsMaxLength: !!sizeMatches && !!sizeMatches.length && sizeMatches[1] == "MAX",
                            IsUnique: !!c.ExtraData.Type.find(t => t == "unique-index")
                        });
                    } else {
                        if (lvl > 0) tableManagement.columnEditor.groups.push(c.Text);
                        const childrens = tableManagement.columnEditor.processColumnList(c.Items, lvl + 1, (lvl == 0 ? c.Id : group), (lvl == 0 ? "" : c.Text));
                        result.push(...childrens);
                    }
                });
                return result;
            },

            editorInit: function(itm, callback) {
                mo.fn.slider.setContent("<div id='columnEditor'></div>");
                var node = document.querySelector("#columnEditor");
                node.classList.add("kv-nbsf");
                let conf = {
                    id: "editor",
                    dom: node,
                    page: 0,
                    pages: [{
                        title: (!!itm ? "Editing column" : "Adding column"),
                        nav: true,
                        structure: [{
                            group: [
                                [{
                                    label: "Name",
                                    type: "text",
                                    placeholder: "Enter a name here",
                                    /* "Use letters, digits and underscore, letter should be first" */
                                    data: "Name",
                                    /* value: !!itm ? itm.Name : "", */
                                    validation: ["minLen|1", "maxLen|255", "dataField"],
                                    required: true,
                                    typing: "dataField"
                                }, ],
                                [{
                                    label: "Category",
                                    data: "CategoryGroup",
                                    type: "select",
                                    ignoreSelectOne: true,
                                    values: [...tableManagement.columnEditor.groups, "Other"],
                                    options: [...tableManagement.columnEditor.groups, "Other"],
                                    /* value: !!itm ? itm.CategoryGroup : "Other", */
                                    required: false,
                                    filter: function(config) {
                                        return tableManagement.columnEditor.currTab === "Custom";
                                    }
                                }, {
                                    label: "New Category",
                                    type: "text",
                                    placeholder: "Enter a custom category here",
                                    data: "Category",
                                    /* value: !!itm ? itm.Category : "", */
                                    validation: ["maxLen|255"],
                                    required: false,
                                    filter: function(config) {
                                        return tableManagement.columnEditor.currTab === "Custom" && config.dataset.CategoryGroup === "Other";
                                    }
                                }, ],
                                [{
                                    label: "Type",
                                    data: "ColumnType",
                                    type: "select",
                                    ignoreSelectOne: true,
                                    values: ["string", "float", "date-time"],
                                    options: ["String", "Float", "DateTime"],
                                    /* value: !!itm ? itm.ColumnType : "", */
                                    required: true,
                                }, {
                                    label: "Size",
                                    type: "text",
                                    placeholder: "Enter a size",
                                    data: "ColumnSize",
                                    /* value: (!!itm ? itm.ColumnSize : "255") || "255", */
                                    validation: ["minLen|1", "maxLen|5", "isInteger"],
                                    typing: "numeric",
                                    filter: function(config) {
                                        return config.dataset.ColumnType === "string";
                                    }
                                }, {
                                    label: "Max Length",
                                    data: "IsMaxLength",
                                    type: "toggle",
                                    values: ["0", "1"],
                                    /* value: !!itm && itm.IsMaxLength ? "1" : "0", */
                                    filter: function(config) {
                                        return config.dataset.ColumnType === "string";
                                    }
                                }, ],
                                [{
                                    label: "Unique",
                                    data: "IsUnique",
                                    type: "toggle",
                                    values: ["0", "1"],
                                    /* value: !!itm && itm.IsUnique ? "1" : "0" */
                                }],
                            ]
                        }, ],
                        callback: function() {},
                    }, ],
                    onSubmit: function(page, currDS) {
                        if (!!!itm && currDS.Name.replace(/\([^)]*\)/g, '') == "EntryId") {
                            mo.fn.notification.show("Unable to create field with EntryId name", 3, 0, 5);
                            return;
                        }
                        const cb = function() {
                            var dtype = "";
                            switch (currDS.ColumnType) {
                                case "string":
                                    dtype = "3";
                                    break;
                                case "float":
                                    dtype = "2";
                                    break;
                                case "date-time":
                                    dtype = "4";
                                    break;
                            }
                            const formData = new FormData();
                            formData.append("FormId", tableManagement.columnEditor.id);
                            formData.append("FieldId", currDS.FieldId);
                            formData.append("Name", currDS.Name.replace(/\([^)]*\)/g, ''));
                            formData.append("GroupEnum", tableManagement.columnEditor.currTab);
                            formData.append("FormSpecificGroup", ((currDS.CategoryGroup == "Other" ? currDS.Category : currDS.CategoryGroup) || "").replace("Select one", ""));
                            formData.append("IsUnique", currDS.IsUnique === "1");
                            formData.append("DataType", dtype);
                            formData.append("Length", currDS.ColumnSize);
                            formData.append("IsMaxLength", currDS.IsMaxLength === "1");
                            mo.fn.overlay.show({
                                close: false,
                                loading: true
                            });
                            const request = new XMLHttpRequest();
                            request.onreadystatechange = () => {
                                if (request.readyState === 4) {
                                    mo.fn.overlay.hide();
                                    if (request.status !== 200 || request.response == "\"Field name must be unique.\"") {
                                        mo.fn.overlay.show({
                                            close: false,
                                            loading: false
                                        });
                                        mo.fn.notification.show(request.response == "\"Field name must be unique.\"" ? "Field name must be unique" : "Operation failed", 3, 0, 5);
                                    } else {
                                        mo.fn.slider.toggle();
                                        var grid = $(document.querySelector("#table-data-grid")).data("kendoGrid");
                                        grid.setDataSource(tableManagement.columnEditor.dataSet());
                                        callback();
                                    }
                                }
                            };
                            request.open("POST", "/builder/FormFieldsWidget/new");
                            request.send(formData);
                        };
                        if (currDS.IsUnique === "1") {
                            mo.fn.overlay.show({
                                close: false,
                                loading: true
                            });
                            const crequest = new XMLHttpRequest();
                            const cformData = new FormData();
                            cformData.append("FormId", tableManagement.columnEditor.id);
                            cformData.append("FieldId", currDS.FieldId || "");
                            cformData.append("Name", currDS.Name.replace(/\([^)]*\)/g, ''));
                            crequest.onreadystatechange = () => {
                                if (crequest.readyState === 4) {
                                    mo.fn.overlay.hide();
                                    const resp = JSON.parse(crequest.response);
                                    if (crequest.status == 400 || !resp) {
                                        mo.fn.overlay.show({
                                            close: false,
                                            loading: false
                                        });
                                        mo.fn.notification.show("Field Is Not Unique", 3, 0, 5);
                                    } else {
                                        cb();
                                    }
                                }
                            };
                            crequest.open("POST", "/builder/FormFieldsWidget/unique-field");
                            crequest.send(cformData);
                        } else {
                            cb();
                        }
                    }
                };
                var ds = {};
                if (!!itm) {
                    var currGroup = tableManagement.columnEditor.groups.find(g => itm.Category);
                    ds = {
                        CategoryGroup: !!currGroup ? currGroup : "Other",
                        Category: itm.Category,
                        ColumnSize: (!!!itm.ColumnSize || itm.ColumnSize == "MAX") ? "255" : itm.ColumnSize,
                        ColumnType: itm.ColumnType,
                        FieldId: itm.FieldId,
                        Group: tableManagement.categories.currTab,
                        IsUnique: !!itm.IsUnique ? "1" : "0",
                        IsMaxLength: itm.ColumnSize == "MAX" ? "1" : "0",
                        Name: itm.Name.replace(/\([^)]*\)/g, '')
                    };
                } else {
                    ds = {
                        CategoryGroup: "Other",
                        Category: "",
                        ColumnSize: "255",
                        ColumnType: "float",
                        FieldId: "",
                        Group: tableManagement.categories.currTab,
                        IsUnique: "0",
                        Name: ""
                    };
                }
                conf.dataset = ds;
                tableManagement.columnEditor.conf = { ...conf
                };
                nbsf.init(conf, 0, ds);
                mo.fn.slider.toggle();
            },

        },

        tableFilter: {

            filterItm: null,
            filterSection: null,
            columns: [],
            values: [],

            init: function(table) {
                tableManagement.tableFilter.filterItm = null;
                tableManagement.tableFilter.filterSection = null;
                tableManagement.tableFilter.columns = [];
                tableManagement.tableFilter.values = [];
                mo.fn.overlay.show({
                    close: false,
                    loading: true
                });
                const cb = function() {
                    var page = tableManagement.holder.querySelector(".table-management-page"); /* page.classList.add("filter-page"); */
                    var dataNode = tableManagement.holder.querySelector(".table-management-data");
                    var mainNode = tableManagement.holder.querySelector(".table-management-main");
                    dataNode.innerHTML = "<div id='tableFilter'>" +
                        "<div id='filter-back-holder'></div>" +
                        "<div id='filterBody' class='query-filter-body'>" +
                        "<div id='filterNode' class='query-filter-builder'></div>" +
                        "<div id='filterOverlay' class='query-filter-overlay " + (!!tableManagement.tableFilter.filterItm && tableManagement.tableFilter.filterItm.Status !== "Active" ? "" : "kv-hide") + "'></div>" +
                        "</div>" +
                        "<div id='filterButtons' class='query-filter-buttons'></div>" +
                        "</div>";

                    var btnHolder = dataNode.querySelector("#filter-back-holder");
                    let backConf = {
                        id: 'filter-back-btn',
                        type: "default",
                        icon: "kv-icon-arrow-left",
                        text: "Back",
                        action: function() {
                            mainNode.classList.toggle("kv-hide");
                            dataNode.classList.toggle("kv-hide");
                            dataNode.innerHTML = "";
                        }
                    };
                    var btnBack = { ...buttonComponent
                    };
                    btnBack.init(btnHolder, backConf);

                    var node = dataNode.querySelector("#filterNode");
                    tableManagement.tableFilter.values.push({
                        type: "custom"
                    });
                    const conf = {
                        fields: tableManagement.tableFilter.columns,
                        values: tableManagement.tableFilter.values,
                    };
                    tableManagement.tableFilter.filterSection = { ...filterSection
                    };
                    const currFilter = !!tableManagement.tableFilter.filterItm ? JSON.parse(tableManagement.tableFilter.filterItm.FilterConfiguration) : null;
                    tableManagement.tableFilter.filterSection.init(node, conf, currFilter);
                    mainNode.classList.toggle("kv-hide");
                    dataNode.classList.toggle("kv-hide");

                    var btnHolder = dataNode.querySelector("#filterButtons");
                    var btnSave = { ...buttonComponent
                    };
                    var btnActivate = { ...buttonComponent
                    };

                    let cnfg = {
                        id: 'saveFilter',
                        type: "default",
                        icon: "",
                        text: "Save",
                        disabled: !!tableManagement.tableFilter.filterItm && tableManagement.tableFilter.filterItm.Status !== 'Active',
                        action: function() {
                            const isNew = !!!tableManagement.tableFilter.filterItm;
                            const id = table.id.split(":")[0];
                            var filter = tableManagement.tableFilter.filterSection.buildFilter(tableManagement.tableFilter.filterSection.config);
                            var request = new XMLHttpRequest();
                            request.onreadystatechange = () => {
                                if (request.readyState === 4) {
                                    mo.fn.overlay.hide();
                                    if (request.status !== 200) {
                                        mo.fn.notification.show("Unable to save filter for view " + id, 3, 0);
                                    } else {
                                        mo.fn.notification.show("Filter was saved successfully", 1, 0);
                                        if (isNew) {
                                            dataNode.querySelector("#statusButton").classList.remove("kv-hide");
                                        }
                                        tableManagement.tableFilter.filterItm = JSON.parse(request.response);
                                    }
                                }
                            };
                            request.open(isNew ? "POST" : "PUT", "/form/api/filters/" + (isNew ? "" : tableManagement.tableFilter.filterItm.Id));
                            request.setRequestHeader("Content-Type", "application/json");
                            const obj = {
                                Id: isNew ? 0 : tableManagement.tableFilter.filterItm.Id,
                                Name: "AudienceFilterForm" + id,
                                AssetId: id,
                                AssetType: "Form",
                                Filter: JSON.stringify(filter),
                                FilterType: "Data",
                                Status: isNew ? "Active" : tableManagement.tableFilter.filterItm.Status,
                                FilterConfiguration: JSON.stringify(tableManagement.tableFilter.filterSection.config)
                            };
                            request.send(JSON.stringify(obj));
                        }
                    };
                    let cnfg_active = {
                        id: 'statusButton',
                        type: "default",
                        icon: "",
                        text: !!tableManagement.tableFilter.filterItm && tableManagement.tableFilter.filterItm.Status !== "Active" ? "Activate" : "Deactivate",
                        action: function() {
                            const id = table.id.split(":")[0];
                            var filter = tableManagement.tableFilter.filterSection.buildFilter(tableManagement.tableFilter.filterSection.config);
                            var request = new XMLHttpRequest();
                            request.onreadystatechange = () => {
                                if (request.readyState === 4) {
                                    mo.fn.overlay.hide();
                                    if (request.status !== 200) {
                                        mo.fn.notification.show("Unable to change filter status for view " + id, 3, 0);
                                    } else {
                                        mo.fn.notification.show("Filter was saved successfully", 1, 0);
                                        tableManagement.tableFilter.filterItm = JSON.parse(request.response);
                                        dataNode.querySelector("#statusButton").innerText = tableManagement.tableFilter.filterItm.Status !== "Active" ? "Activate" : "Deactivate";
                                        dataNode.querySelector("#filterOverlay").classList.toggle("kv-hide");
                                        btnSave.changeMode({ ...cnfg,
                                            disabled: tableManagement.tableFilter.filterItm.Status !== 'Active'
                                        });
                                    }
                                }
                            };
                            request.open("PUT", "/form/api/filters/" + tableManagement.tableFilter.filterItm.Id);
                            request.setRequestHeader("Content-Type", "application/json");
                            const obj = {
                                Id: tableManagement.tableFilter.filterItm.Id,
                                Name: "AudienceFilterForm" + id,
                                AssetId: id,
                                AssetType: "Form",
                                Filter: JSON.stringify(filter),
                                FilterType: "Data",
                                Status: tableManagement.tableFilter.filterItm.Status == "Active" ? "Inactive" : "Active",
                                FilterConfiguration: JSON.stringify(tableManagement.tableFilter.filterSection.config)
                            };
                            request.send(JSON.stringify(obj));
                        }
                    };

                    btnSave.init(btnHolder, cnfg);
                    btnActivate.init(btnHolder, cnfg_active, function() {
                        if (!!!tableManagement.tableFilter.filterItm) {
                            dataNode.querySelector("#statusButton").classList.add("kv-hide");
                        }
                    });
                    mo.fn.overlay.hide();
                    window.scrollTo(0, 0);
                };
                tableManagement.tableFilter.readData(table, cb);
            },

            readData: function(table, cb) {
                tableManagement.tableFilter.getColumns(table, function() {
                    tableManagement.tableFilter.getValues(table, "sso", function() {
                        tableManagement.tableFilter.getValues(table, "sor", function() {
                            tableManagement.tableFilter.getFilter(table, cb);
                        });
                    });
                });
            },

            getColumns: function(table, cb) {
                const id = table.id.split(":")[0];
                const request = new XMLHttpRequest();
                request.onreadystatechange = () => {
                    if (request.readyState === 4) {
                        if (request.status !== 200 || !!!request.response) {
                            mo.fn.overlay.hide();
                            mo.fn.modal.show({
                                close: false,
                                ctaLabel: "OK",
                                title: "Error",
                                content: "Unable to fetch columns for form " + id,
                            });
                        } else {
                            var colsGroups = JSON.parse(request.response);
                            const data = tableManagement.columnEditor.processColumnList(colsGroups, 0, "", "");
                            const cols = [];
                            data.map(d => {
                                cols.push({
                                    "field": d.Name,
                                    "title": d.Name
                                });
                            });
                            tableManagement.tableFilter.columns = [...cols];
                            cb();
                        }
                    }
                };
                request.open("POST", "/builder/FormFieldsWidget/get-data?FormId=" + id);
                request.send();
            },

            getValues: function(table, type, cb) {
                const id = table.id.split(":")[0];
                const request = new XMLHttpRequest();
                request.onreadystatechange = () => {
                    if (request.readyState === 4) {
                        if (request.status !== 200 || !!!request.response) {
                            mo.fn.overlay.hide();
                            mo.fn.modal.show({
                                close: false,
                                ctaLabel: "OK",
                                title: "Error",
                                content: "Unable to fetch data for form " + id,
                            });
                        } else {
                            tableManagement.tableFilter.values.push({
                                type: type,
                                params: JSON.parse(request.response).Data
                            });
                            cb();
                        }
                    }
                };
                request.open("POST", "/form/api/filters/fields/search");
                request.setRequestHeader("Content-Type", "application/json");
                var data = new FormData();
                request.send(JSON.stringify({
                    "type": type,
                    "filter": null,
                    "parameters": {
                        "formId": id
                    },
                    "page": 1,
                    "pageSize": 1000
                }));
            },

            getFilter: function(table, cb) {
                const id = table.id.split(":")[0];
                const payload = {
                    "filter": {
                        "logic": "and",
                        "filters": [{
                            "field": "AssetId",
                            "operator": "eq",
                            "value": table.id.split(":")[0]
                        }, {
                            "field": "AssetType",
                            "operator": "eq",
                            "value": "Form"
                        }]
                    },
                    "page": 1,
                    "pageSize": 1,
                    "sort": [{
                        "field": "Id",
                        "dir": "desc"
                    }]
                };
                const request = new XMLHttpRequest();
                request.onreadystatechange = () => {
                    if (request.readyState === 4) {
                        if (request.status !== 200 || !!!request.response) {
                            mo.fn.overlay.hide();
                            mo.fn.modal.show({
                                close: false,
                                ctaLabel: "OK",
                                title: "Error",
                                content: "Unable to fetch filter for form " + id,
                            });
                        } else {
                            var resp = JSON.parse(request.response);
                            tableManagement.tableFilter.filterItm = !!resp.Data && !!resp.Data.length ? { ...resp.Data[0]
                            } : null;
                            cb();
                        }
                    }
                };
                request.open("POST", "/form/api/filters/search");
                request.setRequestHeader("Content-Type", "application/json");
                request.send(JSON.stringify(payload));
            }

        },

    };