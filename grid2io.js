/**
*
* generic emitter
*/

function emitter() {
}
emitter.prototype.on = function(ev, fn) {
	if(!this.hasOwnProperty('eventReg')) {
		this.eventReg = {};
	}
	if(!this.eventReg.hasOwnProperty(ev)) {
		this.eventReg[ev] = [];
	}
	this.eventReg[ev].push(fn);
}
emitter.prototype.trigger = function(ev, params) {
	if(this.hasOwnProperty('eventReg') && this.eventReg.hasOwnProperty(ev)) {
		for(var i = 0; i < this.eventReg[ev].length; i++ ) {
			this.eventReg[ev][i].apply(this, params);
		}
	}
}



/**
 * mock grid controller 
 * to implement your own controller reimplment the request() method
 *
 * @param settings
 */
function grid2ctrl() {
	this.grid = new grid2();

}
grid2ctrl.prototype = emitter.prototype;
grid2ctrl.prototype.setup = function(settings) {
	this.settings = settings;
}

grid2ctrl.prototype.request = function() {
	var ctrl = this;
	$.ajax(this.settings.source , {dataType: 'json',data: {
			paging: this.grid.getPaging(),
			sorting: this.grid.getSorting(),
			query: this.getQuery()},
		success: function(data) {
			ctrl.grid.flushView();
			ctrl.responseHandler(data);
		}
	});
}

grid2ctrl.prototype.responseHandler = function(data) {
	this.grid.flushView();
	this.grid.setPageSize(data.pageSize);
	this.grid.loadRows(data.rows);
	this.grid.setResultSize(data.resNumRows);
}

grid2ctrl.prototype.initGrid = function(container) {
	this.grid.initUI();
	this.grid.injectInto(container);
	this.grid.initPagers();
	this.grid.drawHeaders();
	var ctrl = this;
	this.grid.on('pageSelected', function(page) {
		ctrl.request();
	});
	this.grid.on('sizeChanged', function(page) {
		ctrl.request();
	});
	this.grid.on('sort', function(page) {
		ctrl.request();
	});
}
grid2ctrl.prototype.getQuery = function() {
	return {};
}

/**
* the main object responsible for the UI
*
*/


function grid2() {
	this.ui = {};
	this.cols = {};
	this.rows = [];
	this.sortOrder = {};
	this.sortQueue = [];
	this.headers = {};
	this.footers = {};
	this.settings = {};
	this.selectedData = {};
	this.formatFns = {};
}
grid2.prototype = new emitter();
grid2.prototype.setup = function(settings) {
	this.settings = settings || {};
}
/*
* col options: {"type": ["raw" | "supervised" (defualt) ], } 
*
*/

grid2.prototype.setCols = function(cols) {
	this.cols = cols;
}
grid2.prototype.initPagers = function() {
	this.bottomPager = new grid2pager();
	this.topPager = new grid2pager();
	this.topPager.bindPager(this.bottomPager);
	this.bottomPager.init(this);
	this.bottomPager.bindPager(this.topPager);
	this.topPager.init(this);
	this.topPager.injectInto(this.ui.topPager);
	this.bottomPager.injectInto(this.ui.bottomPager);
	this.on('sizeChanged', function(size) {
		this.pageSize = size;
	});
	this.on('pageSelected', function(page) {
		this.pageNum = page;
	});
	this.pageSize = this.topPager.getPageSize();
	this.pageNum = this.topPager.cursor;

}

grid2.prototype.initUI = function() {
	this.ui.theaders= $('<thead>');
	this.ui.tbody = $('<tbody>');
	this.ui.tfooter = $('<tfoot>');
	this.ui.table = $('<table>').addClass('gridTable').append(this.ui.theaders,this.ui.tbody,this.ui.tfooter);
	this.ui.topPager = $('<div>');
	this.ui.bottomPager = $('<div>');
	this.ui.wrapper = $('<div>').addClass('gridWrapper').append(this.ui.topPager,this.ui.table,this.ui.bottomPager);
	this.ui.blocker = $('<div>').addClass('gridBlocker').text('loading');
	this.ui.wrapper.prepend(this.ui.blocker);

}
grid2.prototype.injectInto = function(elm) {
	elm.html(this.ui.wrapper);
	elm.append(this.ui.blocker);
	this.ui.blocker.hide();
	elm.css('position', 'relative');
}
grid2.prototype.enableRowSelect = function(key) {
	this.settings.rowSelect = {key : key};
}

grid2.prototype.drawHeaders = function() {
	var row = $('<tr>');
	var grid = this;
	if(this.settings.hasOwnProperty('rowSelect')) {
		this.ui.selectAllBox = $('<input>').attr('type', 'checkbox').change(function() {
			 for(var i = 0 ; i < grid.rows.length; i++) {
				if (this.checked)  {
					grid.rows[i].select();
				} else {
					grid.rows[i].unselect();

				}
			 }

		});
		var selectHeader = $('<th>').append(this.ui.selectAllBox).css('width', '20px');
		row.append(selectHeader);
	}
	for(var col in this.cols) {
		var title = this.cols[col].title || col;
		var header = $('<th>').text(title);
		if(!this.cols[col].hasOwnProperty('sortable') || this.cols[col].sortable) {
			(function() {
				var sortCol = col;
				var sortHeader = header;
				header.click(function() {
					grid.sort(sortCol, sortHeader);
				});
			})();

			header.addClass('sortable');
		}

		row.append(header);
		this.headers[col] = header;
	}
	this.ui.theaders.html(row);
};
grid2.prototype.loadingOn = function() {
	this.ui.blocker.show();
}
grid2.prototype.loadingOff = function() {
	this.ui.blocker.hide();
}
grid2.prototype.colFormatter = function(col, fn) {
	this.formatFns[col] = fn;
}
grid2.prototype.sort = function(col, theader) {
	if(this.sortQueue[0] != col) {
		this.sortQueue.unshift(col);
	}
	if (this.sortOrder.hasOwnProperty(col)) {

		this.sortOrder[col] = (this.sortOrder[col] == -1)?1:-1;
	} else {
		this.sortOrder[col] = -1;
	}
	var sorting = this.getSorting();
	for(var col in this.cols) {
		this.headers[col].removeClass('descend').removeClass('ascend');
	}
	for(var sortCol in sorting) {
		var cls = (sorting[sortCol] == -1)?'descend':'ascend';
		this.headers[sortCol].addClass(cls);
	}
	this.trigger('sort');
}
grid2.prototype.getPaging = function() {
	return {num: this.pageNum, size: this.pageSize};
}
grid2.prototype.getSorting = function() {
	var sorting = {};
	for(var i = 0; i < Math.min(2, this.sortQueue.length);i++) {
		var col = this.sortQueue[i];
		sorting[col] = this.sortOrder[col];
	}
	return sorting;
}


grid2.prototype.loadRows = function(rowsData) {
	for(var i = 0; i < rowsData.length; i++) {
		this.appendRow(rowsData[i]);
	}
}

grid2.prototype.appendRow = function(rowData) {
	var rowObj = new grid2row(this, rowData);
	rowObj.process();
	if(this.settings.hasOwnProperty('rowSelect')) {
		var grid = this;
		rowObj.on('selected', function() {
			grid.selectedData[rowObj.id] = rowObj.data;
		});
		rowObj.on('unselected', function() {
			delete(grid.selectedData[rowObj.id]);
		});
		if(this.selectedData.hasOwnProperty(rowObj.id)) {
			rowObj.select(false);
		}
	}
	this.rows.push(rowObj);
	this.ui.tbody.append(rowObj.ui.row);
}


grid2.prototype.flushView = function() {
	this.ui.tbody.empty();
	this.rows = [];
	if(this.settings.hasOwnProperty('rowSelect')) {
		this.ui.selectAllBox.prop('checked', false);
	}
};
grid2.prototype.setResultSize = function(rowNum) {
	this.topPager.setRowNum(rowNum);
	this.bottomPager.setRowNum(rowNum);
}
grid2.prototype.hideCol = function(col) {
	this.headers[col].hide();
	if(this.footers.hasOwnProperty(col)) {
		this.footers[col].hide();
	}
	this.cols[col].displayStatus = 'hidden';
	for(var i = 0 ; i < this.rows.length; i++ ) {
		this.rows[i].hideCol(col);
	}
}

grid2.prototype.showCol = function(col) {
	this.headers[col].show();
	if(this.footers.hasOwnProperty(col)) {
		this.footers[col].show();
	}
	this.cols[col].displayStatus = 'shown';
	for(var i = 0 ; i < this.rows.length; i++ ) {
		this.rows[i].showCol(col);
	}
}
/**
 *
 * @param cols <Array>
 */
grid2.prototype.showOnlyCols = function(cols) {
	for(var col in this.cols) {
		if(cols.indexOf(col) !== -1) {
			this.showCol(col);
		} else {
			this.hideCol(col);
		}
	}
}

grid2.prototype.setFooter = function(footData) {
	var frow = $('<tr>');
	if(this.settings.hasOwnProperty('rowSelect')) {
		//padding 1 cell
		frow.append($('<td>'));
	}

	for (var col in this.cols) {
		var cell = $('<td>');
		if (footData.hasOwnProperty(col)) {
			cell.text(footData[col]);
		}
		if(this.cols[col].displayStatus == 'hidden') {
			cell.hide();
		}
		frow.append(cell);
		this.footers[col] = cell;
	}
	this.ui.tfooter.html(frow);

}

/**
 * grid row object
 *
 *
 */

function grid2row(grid, rowData) {
	this.ui = {row : $('<tr>'), cells : {}}
	this.grid = grid;
	this.data = rowData;
	this.isSelected = false;
}
grid2row.prototype = emitter.prototype;

grid2row.prototype.process = function() {
	var row = this;
	if(this.grid.settings.hasOwnProperty('rowSelect')) {
		this.ui.row.click(function() {
			row.toggle();
		});
		this.addSelectCell();
		this.id = this.data[this.grid.settings.rowSelect.key];
	}
	for(var col in this.grid.cols) {
		this.addCell(col);
	}
}
grid2row.prototype.addCell = function(col) {
	var td = $('<td>');
	var row = this;
	td.on('contextmenu', function(e) {
		row.grid.trigger("rightClick", [e, row]);
		e.preventDefault();
	});
	if(this.data.hasOwnProperty(col) ) {
		if(this.grid.formatFns.hasOwnProperty(col)) {
			td.html(this.grid.formatFns[col].apply(this, [ this.data, td ]));
		} else {
			switch (this.grid.cols[col].type) {
				case 'raw':
					td.html(this.data[col]);
					break;
				case 'supervised':
				default:
					td.text(this.data[col]);
					break;
			}
		}
	}
	if(this.grid.cols[col].displayStatus == 'hidden') {
		td.hide();
	}
	this.ui.cells[col] = td;
	this.ui.row.append(td);
}
grid2row.prototype.hideCol = function(col) {
	this.ui.cells[col].hide();
}
grid2row.prototype.showCol = function(col) {
	this.ui.cells[col].show();
}
grid2row.prototype.addSelectCell = function() {
	this.ui.selectBox = $('<input>').attr('type', 'checkbox');
	this.ui.row.append($('<td>').append(this.ui.selectBox));
}

grid2row.prototype.select = function(dontEmit) {
	if(!this.isSelected) {
		this.ui.selectBox.prop('checked', 'checked');
		if(!dontEmit) {
			this.trigger('selected');
		}
		this.isSelected = true;
	}
};
grid2row.prototype.unselect = function(dontEmit) {
	if(this.isSelected) {
		this.ui.selectBox.prop('checked', false);
		if(!dontEmit) {
			this.trigger('unselected');
		}
		this.isSelected = false;
	}
};
grid2row.prototype.toggle = function() {
	if(this.isSelected) {
		this.unselect();
	} else {
		this.select();
	}
}

/**
 * grid pager object
 *
 *
 * @param grid
 */


function grid2pager() {

}
grid2pager.prototype = emitter.prototype;

grid2pager.prototype.init = function(grid) {
	this.grid = grid;
	this.cursor = 1;
	this.ui = {};
	this.ui.body = $('<div>').addClass('gridPager');
	var pager = this;
	this.ui.pageSize = $('<select>').addClass('pageSize').change(function() {
		pager.trigger('sizeChanged', [pager.getPageSize()]);
	});

	this.initPageSizes(25, [10, 25, 50, 100]);
	this.ui.pages = $('<div>').addClass('pages');
	this.ui.backButton = $('<div>').addClass('back').attr('title', 'Go to previous page').click(function() {
		pager.selectPage(pager.cursor - 1);
	});
	this.ui.nextButton = $('<div>').addClass('next').attr('title', 'Go to next page').click(function() {
		pager.selectPage(pager.cursor + 1);
	});
	this.ui.resultText = $('<div>').addClass('resultText').text('next')

	this.ui.body.append(this.ui.backButton, this.ui.pages, this.ui.nextButton,this.ui.pageSize, this.ui.resultText);
	this.pageElements = [];
	['pageSelected', 'sizeChanged'].forEach(function(ev) {
		pager.on(ev, function(value) {
			grid.trigger(ev, [value]);

		});
	});
};

grid2pager.prototype.injectInto = function(elm) {
	elm.html(this.ui.body);
};

grid2pager.prototype.initPageSizes = function(defaultSize, sizes) {
	this.ui.pageSize.empty()
	for(var i = 0 ;i < sizes.length;i++) {
		var opt = $('<option>').text(sizes[i]).attr('value', sizes[i]);
		if(sizes[i] == defaultSize) {
			opt.attr('selected', 'selected');
		}
		this.ui.pageSize.append(opt);
	}
};

grid2pager.prototype.setRowNum = function(rowNum) {
	this.rowNum = rowNum;
	var numPages = this.getNumPages();
	if(numPages > 0 && this.cursor > numPages) {
		this.cursor = numPages;
	}
	var start = 0, end = 0;
	if(rowNum > 0) {
		start = (this.cursor - 1) * this.getPageSize() + 1;
		end = start + this.grid.rows.length - 1;
	}
	this.ui.resultText.text('Showing rows ' + start + ' to ' + end + '  out of ' + rowNum)
	this.drawPages();
};
grid2pager.prototype.getPageSize = function() {
	var pagesize =  $('option:selected', this.ui.pageSize).get(0).value;
	return pagesize;
};
grid2pager.prototype.getNumPages = function() {
	var numPages = Math.ceil(this.rowNum/this.getPageSize());
	return numPages;
};
grid2pager.prototype.drawPages = function() {
	this.ui.pages.empty();
	this.pageElements = {};
	var numPages = this.getNumPages();

	var start = Math.max(1, this.cursor - 4);
	var end = Math.min(start + 8,numPages);
	var pages = [];
	if(start > 1) {
		pages.push(1);
		if(start > 2) {
			pages.push('separator');
		}
	}
	for(var pageNum = start ; pageNum <= end; pageNum++ ) {
		pages.push(pageNum);
	}
	if(end < numPages) {
		if(end < numPages - 1) {
			pages.push('separator');
		}
		pages.push(numPages);

	}
	this.ui.pages.css('min-width', (pages.length * 30) + 'px');
	for(var i = 0; i < pages.length;i++) {
		if(pages[i] == 'separator') {
			this.drawPagesSeparator();
		} else {
			this.drawPageElm(pages[i]);
		}

	}

};
grid2pager.prototype.drawPagesSeparator = function() {
	var separator = $('<div>').text('...').addClass('separator');
	this.ui.pages.append(separator);
}
grid2pager.prototype.drawPageElm = function(pageNum) {
	var elm = $('<div>').text(pageNum).addClass('page').attr('title', 'Go to page ' + pageNum);
	if (pageNum == this.cursor) {
		elm.addClass('active');
	}
	this.ui.pages.append(elm);
	this.pageElements[pageNum] = elm;
	var pager = this;
	elm.click(function () {
		pager.selectPage(pageNum);
	})
}
grid2pager.prototype.selectPage = function(pageNum, skipEvent) {
	if(pageNum != this.cursor && !(pageNum < 1 || pageNum > this.getNumPages())) {
		this.cursor = pageNum;
		if(!skipEvent) {
			this.trigger('pageSelected', [pageNum]);
		}
		for(var elmPageNum in this.pageElements) {
			if(elmPageNum == pageNum) {
				this.pageElements[elmPageNum].addClass('active');
			} else {
				this.pageElements[elmPageNum].removeClass('active');
			}
		}
	}
};

grid2pager.prototype.setPageSize = function(size) {
	$('option[value=' + size +']', this.ui.pageSize).attr('selected', 'selected');
};

grid2pager.prototype.bindPager = function(otherPager) {
	this.on('sizeChanged', function (size) {
		otherPager.setPageSize(size, true);
	})

	this.on('pageSelected', function (page) {
		otherPager.selectPage(page, true)

	});
};

