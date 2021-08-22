// SPDX-FileCopyrightText: 2021 codedust
//
// SPDX-License-Identifier: EUPL-1.2

var leika = [];
let offset = 0;
const PAGE_SIZE = 30;

let elSearchInput = document.getElementById('search-input');
let elLoadMore = document.getElementById('a-load-more');
let elResultsSection = document.querySelector('.results');
let elNumResults = document.getElementById('numResults');

// parse JS date from datetime string (format: DD.MM.YYYY hh:mm)
function parseJSDateFromStr(dateTimeStr) {
	let [dateStr, timeStr] = dateTimeStr.split(' ');
	let dateArr = dateStr.split('.');
	let timeArr = timeStr.split(':');
	return new Date(dateArr[2], dateArr[1]-1, dateArr[0], timeArr[0], timeArr[1]);
}

// load LeiKa
Papa.parse("leika.csv", {
	download: true,
	header: true,
	skipEmptyLines: true,
	complete: function(results) {
		leika = results.data;

		// parse dates
		leika.map((leistung, i) => {
			try {
				leistung['date'] = parseJSDateFromStr(leistung['Veröffentlichungsdatum']);
			} catch (e) {
				console.error(e);
			}
		});

		// sort leika bei date
		leika.sort((a,b) => a.date < b.date);

		showResults(elSearchInput.value, offset);
	}
});

// update results
function showResults(query, offset) {
	let leikaFiltered = leika.filter(item => item.Schluessel.indexOf(query) !== -1 || item['Bezeichnung'].toLowerCase().indexOf(query.toLowerCase()) !== -1);

	// show number of results
	elNumResults.innerText = leikaFiltered.length;

	// clear results section
	if (offset == 0) {
		elResultsSection.innerHTML = '';
	}

	// render results
	for (var i = offset; i < offset + PAGE_SIZE; i++) {
		if (leikaFiltered[i] != undefined) {
			let templateLeistung = document.getElementById('template-leistung').innerHTML;
			var rendered = Mustache.render(templateLeistung, leikaFiltered[i]);
			elResultsSection.innerHTML += rendered;
		}
	}

	// update 'load more' link
	const items_remaining = leikaFiltered.length - (offset + PAGE_SIZE);
	if (items_remaining > 0) {
		elLoadMore.classList.remove('is-hidden');
		elLoadMore.innerText = "Mehr laden (" + Math.min(PAGE_SIZE, items_remaining) + " von " + items_remaining + " weiteren)";
	} else {
		elLoadMore.classList.add('is-hidden');
	}
}

// search input event
elSearchInput.addEventListener('keyup', function() {
	offset = 0;
	showResults(elSearchInput.value, offset);
});

// result click event (show/hide table)
document.querySelector('.results').addEventListener('click', function(e) {
	let el = e.target;
	// traverse up the document tree
	while (el.parentElement) {
		// do not fire click event on attributes table
		if (el.className.split(' ').indexOf('leistungs-attributes') !== -1) return;

		// toggle leistungs-attriutes table for this leistung
		if (el.className.split(' ').indexOf('leistung') !== -1) {
			el.querySelector('table').classList.toggle('is-hidden');
			return;
		}

		el = el.parentElement;
	}
});

// load more event
elLoadMore.addEventListener('click', function(e) {
	e.preventDefault();
	offset += PAGE_SIZE;
	showResults(elSearchInput.value, offset);
});
