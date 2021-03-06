# grid2io
grid2io is a small generic grid library that aims to simplify and increase flexibility on integrations of the datagrid element.
It comes with APIs that support server side  flows (no client side implementation bundled)


## Installation

requirements : 
* include jQuery
* include grid2.js
* include grid2.css
* enable access to files in the images/ folder referenced by grid2.css

and you're good to go.

## Supported features 
+ grid row selection (checkboxes)
+ grid sorting/paging 
+ 
+ row and cell level right click event handling
+ supports row-level additional data
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

 Here's the client request in the provided example

    {
        "paging": { "size" : 25, "num":2 },
        "sorting": {"col1": -1},
        "filters" : {} // you can filter by controls bound to your own controller
    }

and the server server response from the example

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
         // example ajax handler
         callServer('/yourserver/grid?' + $.param( { filters: this.ui.getFilters() , paging: this.grid.getPaging() } ), function(data) {
               // must take care of rows flushing / formating / pushing  and setResultSize() of returned page size from server
              ctrl.grid.loadingOff();
              ctrl.grid.flushView();
              ctrl.grid.loadRows(data.rows);
              this.grid.setPageSize(data.pageSize);
              ctrl.grid.setResultSize(data.resultNum);
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

row selection requires you to declair a key column which values are unique and rows can be identified by

    ctrl.grid.enableRowSelect(key);

enableRowSelect() must be called before ctrl.initGrid() is called

at any time, selected rows data is accessable by the selectedData property:

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

The grid row element , a sub element of grid2, that renders grid cells and is passed back on row/cell related events like row formatting callbacks, right click callbacks and row select callbacks.
