# grid2io
grid2io is a small generic grid library that aims to simplify and increase flexibility on integrations of the datagrid element.
It comes with APIs that support server side  flows (no client side implementation bundled)


## Installation

Since grid2io is depended on jQuery, including the jQuery library is mandatory.

## Supported features 
+ grid selection (checkboxes)
+ grid sorting/paging comes out of the box
+ rich right click event handling
+ background row data
+ dynamic column hiding/showing

## Starting and Examples

to completely understand the flow of the library you are strongly recommended to read about the entities composing the library.

to get started look at the example.html page

here's a sample code to start up your grid with the standard provided server protocol

     var ctrl = new grid2ctrl();
     ctrl.setup({source: 'example-server.html'});
     ctrl.grid.enableRowSelect('col1');
     ctrl.grid.setCols({col1: {type:'supervised',sortable:false}, col2: {type:'supervised', title: 'Column 2'}});
     ctrl.initGrid($('#grid-container'));
     ctrl.request();


the above code will create a grid with two columns col1, and col2. col2 will have a formatted grid header.
the grid element will be injected into #grid-container

### Provided protocol

grid2io comes with a provided server-client protocol that can easily be overrode with your own server integration

Example provided client request

    {
        "paging": { "size" : 25, "num":2 },
        "sorting": {"col1": -1},
        "filters" : {} // you can filter by controls bound to your own controller
    }

Example provided server response


    {
        "pageSize": 25,
        "resNumRows": 27,
        "pageNum": 2,
        "row": [{"col1": 'val of col1', "col2": 'val of col2'},
              {"col1": 'val of col1', "col2": 'val of col2'},
              {"col1": 'val of col1', "col2": 'val of col2'}]
    }

### Implement your controller

     var ctrl = new grid2ctrl();
     ctrl.grid.enableRowSelect('col1');
     ctrl.grid.setCols({col1: {type:'supervised',sortable:false}, col2: {type:'supervised', title: 'Column 2'}});
     // your own controller
     ctrl.request = function() {
         this.grid.loadingOn();
         // example handler
         callServer('/yourserver/grid/' status + '/' + this.grid.getPaging(), function(data) {
              ctrl.grid.loadingOff();
              ctrl.grid.flushView();
              ctrl.grid.loadRows(data.rows);
              ctrl.grid.setResultSize(data.results);
         });
              
     }
     ctrl.initGrid($('#grid-container'));
     ctrl.request();


## APIs

**setup grid columns**

    grid.setCols({id: {type: 'supervised', label: 'ID'}, htmlText: {type: 'raw', title: 'Content'}})

grid columns are provided two types: raw and supervised , where raw injects html into column cells and supervised injects text nodes, the default behavior is supervised. 
Generally raw column types are unrecommended, for complex cell data handling see the colFormatter() grid method.

**initiate a server pull / refresh grid**

    ctrl.request();


**show/hide entire columns**

    ctrl.grid.hideCol(colName);
    ctrl.grid.showCol(colName);

**show only specific columns columns**

    ctrl.grid.showOnlyCols([colName1, colName2]);


**selectable rows**

row selection should be enabled before ctrl.initGrid() is called

    ctrl.grid.enableRowSelect(key);

get selected data

    ctrl.grid.selectedData

**format column cells**

the colFormatter grid method receives a column name argument and a callback argument, the callback will be called to render each cell of the specified column.
The callback will be called with the row data object and the jQuery TD element as arguments.

    ctrl.grid.colFormatter('imageUrl', function(rowData, cellElm) {
        cellElm.html($('<img>').attr('src', rowData.imageUrl);
    })


**right click binding**

    ctrl.grid.on('rightClick', function(rowObj, col) {
        alert(rowObj.data[col]);
    });
        


**right-click attachment**

## Entities and architecture

**grid2ctrl**

Implements the request method and wraps control over the grid element.


**grid2**

The grid element that's takes care of presentation , sorting/paging controls and handling UI events.

**grid2row**

The grid row element that renders grid cells and is passed back on row/cell related events.
