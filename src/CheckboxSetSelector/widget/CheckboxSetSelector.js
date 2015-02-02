/*jslint nomen: true */
/*global mx, mxui, mendix, dojo, require, console, define, module */
/**

	CheckboxSetSelector
	========================

	@file      : CheckboxSetSelector.js
	@version   : 1.0
	@author    : ...
	@date      : Friday, January 23, 2015
	@copyright : Mendix Technology BV
	@license   : Apache License, Version 2.0, January 2004

	Documentation
    ========================
	Describe your widget here.

*/

(function () {
    'use strict';

    // test
    require([

        'mxui/widget/_WidgetBase', 'dijit/_Widget', 'dijit/_TemplatedMixin',
        'mxui/dom', 'dojo/dom', 'dojo/query', 'dojo/dom-prop', 'dojo/dom-geometry', 'dojo/dom-class', 'dojo/dom-style', 'dojo/on', 'dojo/_base/lang', 'dojo/_base/declare', 'dojo/text',
        'dojo/_base/array', 'dojo/dom-construct', 'dojo/NodeList-traverse'

    ], function (_WidgetBase, _Widget, _Templated, domMx, dom, domQuery, domProp, domGeom, domClass, domStyle, on, lang, declare, text, array, domConstruct) {

        // Declare widget.
        return declare('CheckboxSetSelector.widget.CheckboxSetSelector', [_WidgetBase, _Widget, _Templated], {

            //Scoping variable
            _data: {},

            // Template path
            templatePath: require.toUrl('CheckboxSetSelector/widget/templates/CheckboxSetSelector.html'),

            /**
             * Mendix Widget methods.
             * ======================
             */

            // PostCreate is fired after the properties of the widget are set.
            postCreate: function () {

                // postCreate
                console.log('CheckboxSetSelector - postCreate');

                // Load CSS ... automaticly from ui directory

                // Setup widgets
                this._setupWidget();

                // Create childnodes
                this._createChildNodes();

                // Show message
                this._showMessage();

            },

            // Startup is fired after the properties of the widget are set.
            startup: function () {
                console.log('CheckboxSetSelector - startup');
            },

            /**
             * What to do when data is loaded?
             */

            update: function (obj, callback) {
                // update
                console.log('CheckboxSetSelector - update');

                // Release handle on previous object, if any.
                if (this._data[this.id]._handles) {
                    array.forEach(this._data[this.id]._handles, function (handle, i) {
                        mx.data.unsubscribe(handle);
                    });
                }

                if (typeof obj === 'string') {
                    var contextGuid = obj;
                    mx.data.get({
                        guid: contextGuid,
                        callback: lang.hitch(this, function (obj) {
                            // Set the object as background.
                            this._data[this.id]._contextObj = obj;
                        })
                    });
                } else {
                    this._data[this.id]._contextObj = obj;
                }

                if (this._data[this.id]._contextObj === null) {
                    // Sorry no data no show!
                    console.log('CheckboxSetSelector  - update - We did not get any context object!');
                } else {
                    // Subscribe to object updates.
                    this._addSubscriptions();
                    // Load data
                    this._loadData();
                }

                // Execute callback.
                if (typeof callback !== 'undefined') {
                    callback();
                }
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
                if (this._data[this.id]._handles) {
                    array.forEach(this._data[this.id]._handles, function (handle, i) {
                        mx.data.unsubscribe(handle);
                    });
                }
            },


            /**
             * Extra setup widget methods.
             * ======================
             */
            _setupWidget: function () {
                console.log('CheckboxSetSelector - setup widget');
                this._data[this.id] = {
                    // General variables
                    _wgtNode: null,
                    _contextObj: null,
                    _handles: [],

                    // Extra variables
                    _selectAllBox: null,
                    _hasStarted: false
                };


                // To be able to just alter one variable in the future we set an internal variable with the domNode that this widget uses.
                this._data[this.id]._wgtNode = this.domNode;
                if (this.addSelectAll) {

                    console.log('addSelectAll');
                    this._data[this.id]._selectAllBox = domConstruct.create('input', {
                        type: 'checkbox'
                    });

                    console.log(this._data[this.id]._selectAllBox);
                    var firstTh = domQuery('.first-th', this._data[this.id]._wgtNode)[0];
                    domConstruct.place(this._data[this.id]._selectAllBox, firstTh);
                }

            },

            // Create child nodes.
            _createChildNodes: function () {

                // Assigning externally loaded library to internal variable inside function.
                console.log('CheckboxSetSelector - createChildNodes events');
            },

            // Attach events to newly created nodes.
            _setupEvents: function () {

                console.log('CheckboxSetSelector - setup events');
                if (this._data[this.id]._selectAllBox && this.addSelectAll) {
                    on(domQuery('thead tr', this._data[this.id]._wgtNode), 'click', lang.hitch(this, function (event) {
                        var tbody = domQuery('tbody', this._data[this.id]._wgtNode)[0];
                        //toggle all checkboxes when the row is clicked
                        this._selectAllBoxes(domQuery('input', tbody));
                    }));
                }
                on(domQuery('tbody tr', this._data[this.id]._wgtNode), 'click', lang.hitch(this, function (event) {
                    var row = domQuery(event.target).parent()[0];
                    //toggle the checkbox when the row is clicked
                    this._toggleCheckboxes(domQuery('input', row));
                }));

            },

            _addSubscriptions: function () {
                console.log('CheckboxSetSelector - Add subscriptions');
                var subHandle = mx.data.subscribe({
                    guid: this._data[this.id]._contextObj.getGuid(),
                    callback: lang.hitch(this, function (guid) {

                        mx.data.get({
                            guid: guid,
                            callback: lang.hitch(this, function (obj) {

                                // Set the object as background.
                                this._data[this.id]._contextObj = obj;

                            })
                        });

                    })
                });
                this._data[this.id]._handles.push(subHandle);
            },

            /**
             * Interaction widget methods.
             * ======================
             */
            _loadData: function () {
                console.log('CheckboxSetSelector - Load data');

                //default fetch
                var refEntity = this.reference.split('/')[1],
                    filters = {},
                    xpath = '//' + refEntity;

                filters.sort = [[this.sortAttr, this.sortOrder]];
                if (this.limit > 0) {
                    filters.amount = this.limit;
                }
                if (this.constraint) {
                    xpath = '//' + refEntity + this.constraint.replace('[%CurrentObject%]', this._data[this.id]._contextObj);
                }
                mx.data.get({
                    xpath: xpath,
                    filter: filters,
                    callback: lang.hitch(this, function (objs) {
                        this._fetchData(objs);
                    })
                });

                // TODO, get aditional data from mendix.
            },

            _setAsReference: function (guid) {
                console.log('CheckboxSetSelector - set as reference');
                var referenceStr = this.reference.split('/')[0];
                this._data[this.id]._contextObj.addReferences(referenceStr, [guid]);
            },

            _execMf: function (mf, guids) {
                console.log('CheckboxSetSelector - Execute MF with guids: ', guids);
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
                            console.log(error.description);
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
                console.log('CheckboxSetSelector - Build Template');

                var tbody = domQuery('tbody', this._data[this.id]._wgtNode)[0],
                    thead = domQuery('thead tr', this._data[this.id]._wgtNode)[0];
                //empty the table
                domConstruct.empty(tbody);
                
                array.forEach(headers, function (header) {
                    var th = domConstruct.create('th', {
                        innerHTML: header
                    });
                    domConstruct.place(th, thead, 'last');
                });

                array.forEach(rows, function (rowData) {
                    var row = domConstruct.toDom(dojo.cache('CheckboxSetSelector.widget', 'templates/CheckboxSetSelector_row.html'));
                    row.id = rowData.id;
                    array.forEach(rowData.data, function (value) {
                        var td = domConstruct.create('td', {
                            innerHTML: value
                        });
                        domConstruct.place(td, row, 'last');
                    });
                    domConstruct.place(row, tbody);
                });

                this.getReferencedBoxes();
                // Setup events
                this._setupEvents();
            },

            _fetchData: function (objs) {
                console.log('CheckboxSetSelector - Fetch Data');
                var data = [],
                    finalLength = objs.length * this.displayAttrs.length,
                    self = this;

                array.forEach(objs, function (obj) {
                    array.forEach(self.displayAttrs, function (attr, index) {
                        obj.fetch(attr.displayAttr, function (value) {
                            if (typeof value === 'string') {
                                value = mxui.dom.escapeString(value);
                                value = value.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gm, ' Warning! Script tags not allowed. ');
                            }
                            if (attr.currency !== "None") {
                                value = self._parseCurrency(value, attr);
                            }
                            
                            
                            data.push({
                                'obj': obj.getGuid(),
                                'index': index,
                                'value': value,
                                'header': attr.header
                            });
                            if (data.length === finalLength) {
                                self._processData(data);
                            }
                        });
                    });
                });


            },

            _processData: function (data) {
                console.log('CheckboxSetSelector - process data');
                var rowObjs = [],
                    rows = [],
                    headers = [];

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
                    refguids = this._data[this.id]._contextObj.getReferences(referenceStr);

                array.forEach(boxes, function (box) {
                    if (box.checked) {
                        box.checked = false;
                        if (refguids) {
                            self._data[self.id]._contextObj.removeReferences(referenceStr, refguids);
                        }
                    } else {
                        box.checked = true;
                        self._setAsReference(domQuery(box).closest('tr')[0].id);
                    }
                });
                this._execMf(this.onChangeMf, [this._data[this.id]._contextObj.getGuid()]);
            },

            _checkCheckboxes: function (boxes) {
                console.log('CheckboxSetSelector - check checkboxes');
                array.forEach(boxes, function (box) {
                    if (!box.checked) {
                        box.checked = true;
                    }
                });
            },

            _selectAllBoxes: function (boxes) {
                console.log('CheckboxSetSelector - (De)select all checkboxes');
                var self = this,
                    referenceStr = this.reference.split('/')[0],
                    refguids = this._data[this.id]._contextObj.getReferences(referenceStr);
                array.forEach(boxes, function (box) {
                    if (self._data[self.id]._selectAllBox.checked) {
                        box.checked = true;
                        self._setAsReference(domQuery(box).closest('tr')[0].id);
                    } else {
                        box.checked = false;
                        if (refguids) {
                            self._data[self.id]._contextObj.removeReferences(referenceStr, refguids);
                        }
                    }

                });
            },

            /**
             * Helper functions
             * ======================
             */

            getReferencedBoxes: function () {
                console.log('CheckboxSetSelector - get referenced boxes');
                var refguids = this._data[this.id]._contextObj.getReferences(this.reference.split('/')[0]),
                    boxes = [];
                if (refguids) {
                    array.forEach(refguids, function (id) {
                        boxes.push(domQuery('#' + id + ' input[type=checkbox]')[0]);
                    });
                }
                this._checkCheckboxes(boxes);
            },

            _parseCurrency: function (value, attr) {
                var currency = value;
                switch (attr.currency) {
                case 'Euro':
                    currency = '&#8364 ' + mx.parser.formatNumber(value, attr.useSeparators, attr.decimalPrecision);
                    break;
                case 'Dollar':
                    currency = '&#36 ' + mx.parser.formatNumber(value, attr.useSeparators, attr.decimalPrecision);
                    break;
                case 'Yen':
                    currency = '&#165 ' + mx.parser.formatNumber(value, attr.useSeparators, attr.decimalPrecision);

                    break;
                case 'Pound':
                    currency = '&#163 ' + mx.parser.formatNumber(value, attr.useSeparators, attr.decimalPrecision);

                    break;
                default:
                    console.log('Error: Currency type not found');
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

}());