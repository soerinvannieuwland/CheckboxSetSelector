/*jslint nomen: true */
/*global mx, mxui, mendix, dojo, require, console, define, module */

require([
    'dojo/_base/declare', 'mxui/widget/_WidgetBase', 'dijit/_TemplatedMixin',
    'mxui/dom', 'dojo/dom', 'dojo/query', 'dojo/dom-prop', 'dojo/dom-geometry', 'dojo/dom-class', 'dojo/dom-style', 'dojo/on', 'dojo/_base/lang', 'dojo/text',
    'dojo/_base/array', 'dojo/dom-construct', 'dojo/text!CheckboxSelector/widget/template/CheckboxSelector.html', 'dojo/NodeList-traverse'
], function (declare, _WidgetBase, _TemplatedMixin, domMx, dom, domQuery, domProp, domGeom, domClass, domStyle, on, lang, text, array, domConstruct, widgetTemplate) {
    'use strict';
    // Declare widget's prototype.
    return declare('CheckboxSelector.widget.checkboxselector', [_WidgetBase, _TemplatedMixin], {
        // _TemplatedMixin will create our dom node using this HTML template.
        templateString: widgetTemplate,
        // General variables
        _wgtNode: null,
        _contextObj: null,
        _handles: null,

        // Extra variables
        _selectAllBox: null,
        _readonly: null,
		_firstTh: null,


        /**
         * Mendix Widget methods.
         * ======================
         */
        constructor: function () {
            this._handles = [];
            this._readonly = false;
        },

        // PostCreate is fired after the properties of the widget are set.
        postCreate: function () {

            // Load CSS ... automaticly from ui directory

            // Setup widgets
            this._setupWidget();

            // Create childnodes
            this._createChildNodes();

        },

        /**
         * What to do when data is loaded?
         */

        update: function (obj, callback) {
            // update
            console.debug('CheckboxSelector - update');

            this._contextObj = obj;

            if (this._contextObj === null) {
                
				// Sorry no data no show!
				domStyle.set(this.domNode, "display", "none");
                console.debug('CheckboxSelector  - update - We did not get any context object!');
            } else {
				domStyle.set(this.domNode, "display", "initial");
				this._readonly = this._contextObj.isReadonlyAttr(this.reference.split('/')[0]);
                
				// Subscribe to object updates.
				this._resetSubscriptions();
                
				// Load data
                this._loadData();
            }

            callback();
            
        },

        /**
         * How the widget re-acts from actions invoked by the Mendix App.
         */
        suspend: function () {
            //TODO, what will happen if the widget is suspended (not visible).
        },

        resume: function () {
            //TODO, what will happen if the widget is resumed (set visible).
        },

        enable: function () {
            //TODO, what will happen if the widget is enabled (not visible).
        },

        disable: function () {
            //TODO, what will happen if the widget is disabled (set visible).
        },

        unintialize: function () {
        },


        /**
         * Extra setup widget methods.
         * ======================
         */
        _setupWidget: function () {
            console.debug('CheckboxSelector - setup widget');

            // To be able to just alter one variable in the future we set an internal variable with the domNode that this widget uses.
            this._wgtNode = this.domNode;
			this._firstTh = domQuery('.first-th', this._wgtNode)[0];
			
			if (this.addSelectAll) {
                console.debug('addSelectAll');
                this._selectAllBox = domConstruct.create('input', {
                    type: 'checkbox'
                });
				
                console.debug(this._selectAllBox);
                
				domConstruct.place(this._selectAllBox, this._firstTh);
            }

        },

        // Create child nodes.
        _createChildNodes: function () {

            // Assigning externally loaded library to internal variable inside function.
            console.debug('CheckboxSelector - createChildNodes events');
        },

        // Attach events to newly created nodes.
        _setupEvents: function () {

            console.debug('CheckboxSelector - setup events');
            if (!this.readOnly && !this._readonly) {
                if (this._selectAllBox && this.addSelectAll) {
                    on(domQuery('thead tr', this._wgtNode), 'click', lang.hitch(this, function (event) {

                        var tbody = domQuery('tbody', this._wgtNode)[0];
                        //toggle all checkboxes when the row is clicked
                        this._selectAllBoxes(domQuery('input', tbody));
                    }));
                }
                on(domQuery('tbody tr', this._wgtNode), 'click', lang.hitch(this, function (event) {
                    if (event.target.tagName.toUpperCase() === 'INPUT') {
                        this._runReferences(event.target);
                    } else {
                        var row = domQuery(event.target).parent()[0];
                        //toggle the checkbox when the row is clicked
                        this._toggleCheckboxes(domQuery('input', row));
                    }
                }));
            } else {
                //disable all checkboxes
                this._setDisabled(domQuery('input', this.domNode));

            }

        },

		_resetSubscriptions: function () {
			var entHandle = null, 
				attrHandle = null, 
				validationHandle = null;

			// Release handles on previous object, if any.
			if(this._handles){
				this._handles.forEach(function (handle, i) {
					mx.data.unsubscribe(handle);
				});
			}

			if (this._contextObj) {
				entHandle = this.subscribe({
					entity: this.reference.split('/')[1],
					callback: lang.hitch(this,function(guid) {
						this._loadData();
					})
				});

				attrHandle = this.subscribe({
					guid: this._contextObj.getGuid(),
					attr: this.reference.split('/')[0],
					callback: lang.hitch(this,function(guid,attr,attrValue) {
						this._loadData();
					})
				});

				validationHandle = mx.data.subscribe({
					guid     : this._contextObj.getGuid(),
					val      : true,
					callback : lang.hitch(this,this._handleValidation)
				});

				this._handles = [entHandle, attrHandle, validationHandle];
			}
		},
		
		_handleValidation: function(validations) {
			this._clearValidations();

			var val = validations[0],
				msg = val.getReasonByAttribute(this.reference.split('/')[0]);    

			if(this.readOnly){
				val.removeAttribute(this.reference.split('/')[0]);
			} else {                                
				if (msg) {
					this._addValidation(msg);
					val.removeAttribute(this.reference.split('/')[0]);
				}
			}
		},

		_clearValidations: function() {
			domConstruct.destroy(this._alertdiv);
		},

		_addValidation : function(msg) {
			this._alertdiv = domConstruct.create("div", { 
				class : 'alert alert-danger',
				innerHTML: msg });

			this.domNode.appendChild(this._alertdiv);

		},

        /**
         * Interaction widget methods.
         * ======================
         */
        _loadData: function () {
            console.debug('CheckboxSelector - Load data');

			//default fetch
			var refEntity = this.reference.split('/')[1],
				filters = {},
				xpath = '//' + refEntity;

			filters.sort = [[this.sortAttr, this.sortOrder]];
			if (this.limit > 0) {
				filters.amount = this.limit;
			}
			if (this.constraint) {
				xpath = '//' + refEntity + this.constraint.replace('[%CurrentObject%]', this._contextObj);
			}
			mx.data.get({
				xpath: xpath,
				filter: filters,
				callback: lang.hitch(this, function (objs) {
					this._fetchData(objs);
				})
			});

        },

        _setAsReference: function (guid) {
            console.debug('CheckboxSelector - set as reference');
            var referenceStr = this.reference.split('/')[0];
            this._contextObj.addReferences(referenceStr, [guid]);
        },

        _execMf: function (mf, guids) {
            console.debug('CheckboxSelector - Execute MF with guids: ', guids);
            if (mf && guids) {
                mx.data.action({
                    params: {
                        applyto: 'selection',
                        actionname: mf,
                        guids: guids
                    },
                    callback: lang.hitch(this, function (obj) {
                        //TODO what to do when all is ok!
                    }),
                    error: function (error) {
                        console.debug(error.description);
                    }
                }, this);
            }
        },

        /**
         * Fetching Data & Building widget
         * ======================
         */
        _buildTemplate: function (rows, headers) {
            //TODO: Load template for each object
            console.debug('CheckboxSelector - Build Template');

            var tbody = domQuery('tbody', this._wgtNode)[0],
                thead = domQuery('thead tr', this._wgtNode)[0];
            //empty the table
			domConstruct.empty(tbody);
			domConstruct.empty(thead);
			
			domConstruct.place(this._firstTh, thead, 'first'); 

			array.forEach(headers, function (header) {
                var th = domConstruct.create('th', {
                    innerHTML: header
                });
                domConstruct.place(th, thead, 'last');
            });

            array.forEach(rows, lang.hitch(this, function (rowData) {
                
				var row = domConstruct.create('tr', { 
					id : this.domNode.id + '_' + rowData.id
					}
				);
				var checkboxtd = domConstruct.create('td');
				var input = domConstruct.create('input', {
					type : 'checkbox',
					value : rowData.id
				});

				domConstruct.place(input, checkboxtd);
				domConstruct.place(checkboxtd, row);
				
                array.forEach(rowData.data, function (value) {
					var td = domConstruct.create('td', {
						innerHTML: value
					});
					domConstruct.place(td, row, 'last');
                });
                domConstruct.place(row, tbody);
            }));

            this.getReferencedBoxes();

            // Setup events
            this._setupEvents();
        },

        _fetchData: function (objs) {
            var data = [],
                finalLength = objs.length * this.displayAttrs.length;

            array.forEach(objs, lang.hitch( this, function (obj) {
				array.forEach(this.displayAttrs, lang.hitch(this, function (attr, index) {
					obj.fetch(attr.displayAttr, lang.hitch(this, function (value) {
                        if (typeof value === 'string') {
                            value = mxui.dom.escapeString(value);
                            value = value.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gm, ' Warning! Script tags not allowed. ');
                        }
                        if (attr.currency !== "None") {
							value = this._parseCurrency(value, attr);
                        }

                        data.push({
                            'obj': obj.getGuid(),
                            'index': index,
                            'value': value,
                            'header': attr.header
                        });
                        if (data.length === finalLength) {
							this._processData(data);
                        }
                    }));
                }));
            }));
        },

        _processData: function (data) {
            var rowObjs = [],
                rows = [],
                headers = [];

            //filter doubles
            array.forEach(data, function (item) {
                if (array.indexOf(rowObjs, item.obj) === -1) {
                    rowObjs.push(item.obj);
                }
            });

            array.forEach(rowObjs, function (obj) {
                var rowData = [],
                    row = {};
                row.id = obj;
                array.forEach(data, function (item) {
                    if (obj === item.obj) {
                        rowData.splice(item.index, 0, item.value);
                        if (array.indexOf(headers, item.header) === -1) {
                            headers.splice(item.index, 0, item.header);
                        }
                    }
                });
                row.data = rowData;
                array.forEach(headers, function (header) {
                    if (obj === header.id) {
                        row.header = header.header;
                    }
                });
                rows.push(row);
            });
            this._buildTemplate(rows, headers);
        },

        /**
         * Checkbox functionality
         * ======================
         */
        _toggleCheckboxes: function (boxes) {

            var self = this,
                referenceStr = this.reference.split('/')[0],
                refguids = this._contextObj.getReferences(referenceStr);

            array.forEach(boxes, function (box) {
                if (box.checked) {
                    box.checked = false;
                } else {
                    box.checked = true;
                }
            });
            this._runReferences(boxes);
        },

        _setDisabled: function (boxes) {
            array.forEach(boxes, function (box) {
                box.disabled = true;
            });
        },

        _checkCheckboxes: function (boxes) {
            console.debug('CheckboxSelector - check checkboxes');
            array.forEach(boxes, function (box) {
                if (!box.checked) {
                    box.checked = true;
                }
            });
        },

        _selectAllBoxes: function (boxes) {
            console.debug('CheckboxSelector - (De)select all checkboxes');
            var self = this;
            array.forEach(boxes, function (box) {
                if (self._data[self.id]._selectAllBox.checked) {
                    box.checked = true;
                } else {
                    box.checked = false;
                }
            });
            this._runReferences(boxes);
        },

        _runReferences: function (boxes) {
            console.debug('CheckboxSelector - run references');
            var self = this,
                referenceStr = this.reference.split('/')[0],
                refguids = this._contextObj.getReferences(this.reference.split('/')[0]),
                id = null;

            if (Array.isArray(boxes)) {
                array.forEach(boxes, function (box) {
                    id = box.value;
                    if (box.checked) {
                        console.debug('checked');
                        self._setAsReference();
                    } else {
                        console.debug('CheckboxSelector - Remove references');
                        if (refguids) {
                            self._data[self.id]._contextObj.removeReferences(referenceStr, refguids);
                        }
                    }
                });
            } else {
                if (boxes.checked) {
                    console.debug('checked');
					this._setAsReference(boxes.value);
                } else {
                    console.debug('CheckboxSelector - Remove references');
                    this._contextObj.removeReferences(referenceStr, boxes.value);

                }
            }
            this._execMf(this.onChangeMf, [this._contextObj.getGuid()]);
        },

        /**
         * Helper functions
         * ======================
         */

        getReferencedBoxes: function () {
            console.debug('CheckboxSelector - get referenced boxes');
            var refguids = this._contextObj.getReferences(this.reference.split('/')[0]),
                boxes = [];
            if (refguids) {
                array.forEach(refguids, lang.hitch(this, function (id) {
                    boxes.push(domQuery('#' + this.domNode.id + '_' + id + ' input[type=checkbox]')[0]);
                }));
            }
            this._checkCheckboxes(boxes);
        },

        _parseCurrency: function (value, attr) {
            var currency = value;
            switch (attr.currency) {
            case 'Euro':
                currency = '&#8364 ' + mx.parser.formatValue(value, "currency", {
                    places: attr.decimalPrecision
                });
                break;
            case 'Dollar':
                currency = '&#36 ' + mx.parser.formatValue(value, "currency", {
                    places: attr.decimalPrecision
                });
                break;
            case 'Yen':
                currency = '&#165 ' + mx.parser.formatValue(value, "currency", {
                    places: attr.decimalPrecision
                });

                break;
            case 'Pound':
                currency = '&#163 ' + mx.parser.formatValue(value, "currency", {
                    places: attr.decimalPrecision
                });

                break;
            default:
                console.debug('Error: Currency type not found');
                break;
                // type not found
            }
            return currency;
        },

        _checkValue: function (obj, value, attr) {
            //TODO: ENUM captions
        }

    });
});