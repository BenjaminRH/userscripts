// ==UserScript==
// @id          10bisscript@userscripts.org
// @name        10bis
// @version     1.0
// @release     2014-09-03
// @author      Benjamin Harris
// @namespace   10bisscript@userscripts.org
// @description A suite of tools to improve the 10bis experience
// @include     http://www.10bis.co.il/Restaurants/Menu/Delivery*
// @match       http://www.10bis.co.il/Restaurants/Menu/Delivery*
// ==/UserScript==

// MENU DISH COMPILER
function getMenu() {
	var menu = [];
	var sections = document.getElementsByClassName('menuMainTbl dishesTable');

	var i, j, $el, $elHead, dish, dishList;
	for (i = 0; i < sections.length; i++) {
		var section = {};

		$el = sections[i];
		$elHead = $el.parentElement.parentElement.previousElementSibling;
		dishList = $el.getElementsByClassName('dishName');

		section.title = $elHead.getElementsByClassName('CategoryName')[0].childNodes[0].nodeValue.trim();
		section.dishes = [];

		if (section.title === 'הודעה ללקוחות האתר') {
			continue;
		}

		for (j = 0; j < dishList.length; j++) {
			dish = dishList[j].getElementsByTagName('td');
			section.dishes.push({
				name: dish[0].childNodes[0].nodeValue.trim(),
				price: parseFloat(dish[1].childNodes[0].nodeValue.trim().replace('₪ ', '')),
			});
		}

		menu.push(section);
	}

	return menu;
}

// SECTION GETTER [FROM DISH]
function getSectionFromDish(menu, dish) {
	for (var i = 0; i < menu.length; i++) {
		for (var j = 0; j < menu[i].dishes.length; j++) {
			if (menu[i].dishes[j].name === dish.name && menu[i].dishes[j].price === dish.price) {
				return menu[i];
			}
		}
	}
}

// SECTION GETTER [FROM SECTION TITLE]
function getSectionFromTitle(menu, title) {
	for (var i = 0; i < menu.length; i++) {
		if (menu[i].title === title) {
			return menu[i];
		}
	}
}

// DISH FILTER
// options: sections (array of section names), min (int minimum price), max (int maximum price)
function filterDishes(menu, options) {
	var dishes = [];
	var section, sectionDishes, adding;
	for (var i = 0; i < menu.length; i++) {
		if (options.sections) {
			if (options.sections.indexOf(menu[i].title) !== -1) {
				section = getSectionFromTitle(menu, menu[i].title);
			}
			else {
				continue;
			}
		}
		else {
			section = getSectionFromTitle(menu, menu[i].title);
		}

		sectionDishes = [];

		for (var j = 0; j < section.dishes.length; j++) {
			adding = true;

			if (options.min && section.dishes[j].price < options.min) {
				adding = false;
			}

			if (options.max && section.dishes[j].price > options.max) {
				adding = false;
			}

			if (adding) {
				sectionDishes.push(section.dishes[j]);
			}
		}

		dishes = dishes.concat(sectionDishes);
	}

	return dishes;
}

// RANDOM DISH
function randomDish(dishes, bwahahaha) {
	if (bwahahaha) {
		return 4; // chosen by fair dice roll.
		          // guaranteed to be random.
	}
	return dishes[Math.floor(Math.random() * dishes.length)];
}

// GENERATE APP HTML
function generateHTML(menu) {
	var html = ''
		+ '<div style="float: left; width: 100%;" dir="ltr">'
			+ '<hr>'
			+ '<h3>Random Dish</h3>'
			+ '<p>Min price: ₪<input id="filter-min" type="text" value="20"></p>'
			+ '<p>Max price: ₪<input id="filter-max" type="text"></p>'
			+ '<p>Sections: <select id="filter-sections" multiple style="width: 100%; min-height: 100px;">';

	for (var i = 0; i < menu.length; i++) {
		html += '<option value="' + menu[i].title + '" selected>' + menu[i].title + '</option>';
	}

	html += ''
			+ '</select></p>'
			+ '<button id="filter-button-go">Go!</button> or <button id="filter-button-reset">Reset filters</button>'
			+ '<div>'
				+ '<hr>'
				+ '<p>Results:</p>'
				+ '<p id="random-dish-result" dir="rtl" style="float: right; font-weight: normal;">(none)</p>'
			+ '</div>'
		+ '</div>';

	return html;
}

// INSERT APP
function insertApp(html) {
	var $container = document.getElementsByClassName('resProfileLeftSide')[0];
	var $app = document.createElement('div');

	$app.innerHTML = html;
	$container.appendChild($app);
}

// FILTER OPTIONS GETTER
function getFilterOptions() {
	var min = parseFloat(document.getElementById('filter-min').value) || 0;
	var max = parseFloat(document.getElementById('filter-max').value) || 0;
	var options = document.getElementById('filter-sections').options;
	var sections = [];

	for (var i = 0; i < options.length; i++) {
		if (options[i].selected) {
			sections.push(options[i].value);
		}
	}

	return {
		max: max,
		min: min,
		sections: sections,
	};
}

// UPDATE RESULTS WITH DISH
function updateResults(dish) {
	var $results = document.getElementById('random-dish-result');

	if (typeof dish === 'string') {
		$results.innerText = dish;
	}
	else {
		$results.innerText = dish.price + '₪ - ' + dish.name;
	}
}

// HANDLE GO ACTION
function handleFilterGo() {
	var dishes = filterDishes(activeMenu, getFilterOptions());
	if (dishes.length === 0) {
		updateResults('(no results)');
	}
	else {
		var dish = randomDish(dishes);
		updateResults(dish);
	}
}

// HANDLE RESET ACTION
function handleFilterReset() {
	var min = document.getElementById('filter-min');
	var max = document.getElementById('filter-max');
	var options = document.getElementById('filter-sections').options;

	min.value = '20';
	max.value = '';

	for (var i = 0; i < options.length; i++) {
		options[i].selected = true;
	}
}

// :::::BEGIN APPLICATION:::::

activeMenu = [];

(function() {
	console.log('Running 10bis userscript!')
	activeMenu = getMenu(); // Global menu
	insertApp(generateHTML(activeMenu)); // Insert app
	document.getElementById('filter-button-go').onclick = handleFilterGo;
	document.getElementById('filter-button-reset').onclick = handleFilterReset;
}());
