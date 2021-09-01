// SPDX-FileCopyrightText: 2021 codedust
//
// SPDX-License-Identifier: EUPL-1.2

var leika = [];
let offset = 0;
const PAGE_SIZE = 30;

const TYPE_EXPLANATIONS = {
	"1": "Regelungs- und Vollzugskompetenz auf Bundesebene",
	"2": "Regelungskompetenz auf Bundesebene, Vollzug durch Landes- oder kommunale Ebene",
	"2a": "Regelungskompetenz auf Bundesebene, Vollzug durch Landesebene",
	"2b": "Regelungskompetenz auf Bundesebene, Ausführungsvorschriften durch Landesebene, Vollzug durch kommunale Ebene",
	"3": "Regelungskompetenz auf Bundesebene (Abweichungsrecht bzw. ehemals Rahmengesetzgebung), Vollzug auf Landes- oder kommunaler Ebene",
	"3a": "Regelungskompetenz auf Bundesebene (Abweichungsrecht bzw. ehemals Rahmengesetzgebung), Vollzug durch Landesebene",
	"3b": "Regelungskompetenz auf Bundesebene (Abweichungsrecht bzw. ehemals Rahmengesetzgebung), Ausführungsvorschriften durch Landesebene, Vollzug durch kommunale Ebene",
	"2/3": "Regelungskompetenz auf Bundesebene, Vollzug durch Landes- oder kommunale Ebene",
	"1;2/3": "Regelungskompetenz auf Bundesebene, Vollzug durch Bundes, Landes- oder kommunale Ebene",
	"4": "Regelungskompetenz auf Landesebene",
	"4a": "Regelungskompetenz und Vollzug auf Landesebene",
	"4b": "Regelungskompetenz auf Landesebene, Vollzug durch kommunale Ebene",
	"5": "Regelungskompetenz auf kommunaler Ebene",
	"6": "allgemeine Hinweise mit informativem Charakter, die nicht eine bestimmte Leistungserbringung betreffen",
	"7": "Service-und Sonderrufnummern mit Informationsbedarf in der Bevölkerung",
	"10": "Verwaltungsinterne Leistung",
	"11": "Informationen zu SDG - allgemeine Rechte und Pflichten",
	"12": "Informationen zu SDG - Hilfs- und Problemlösungsdienste"
}

let elSearchInput = document.getElementById('search-input');
let elLoadMore = document.getElementById('a-load-more');
let elResultsSection = document.querySelector('.results');
let elNumResults = document.getElementById('numResults');
let templateLeistung = document.getElementById('template-leistung').innerHTML;
let templateTag = document.getElementById('template-tag').innerHTML;

// parse JS date from datetime string (format: DD.MM.YYYY hh:mm)
function parseJSDateFromStr(dateTimeStr) {
	let [dateStr, timeStr] = dateTimeStr.split(' ');
	let dateArr = dateStr.split('.');
	let timeArr = timeStr.split(':');
	return new Date(dateArr[2], dateArr[1]-1, dateArr[0], timeArr[0], timeArr[1]);
}

function renderAsTags(str) {
	if (str == '') return '';
	let tagsStr = str.split('|');
	let outputHTML = '';
	for (tagStr of tagsStr) {
		outputHTML += Mustache.render(templateTag, tagStr);
	}
	return outputHTML;
}

// load LeiKa
Papa.parse("leika.csv", {
	download: true,
	header: true,
	skipEmptyLines: true,
	complete: function(results) {
		leika = results.data;

		leika.map((leistung, i) => {
			// parse dates
			try {
				leistung['date'] = parseJSDateFromStr(leistung['Veröffentlichungsdatum']);
			} catch (e) {
				console.error(e);
			}

			// add typeExplanation
			if (leistung['Typ'] in TYPE_EXPLANATIONS) {
				leistung['typeExplanation'] = TYPE_EXPLANATIONS[leistung['Typ']];
			} else if (leistung['Typ'] !== ''){
				console.error("unbekannter Leistungtyp", leistung['Typ'], leistung, i);
				leistung['typeExplanation'] = 'unbekannter Leistungtyp';
			}

			// add renderAsTags function
			leistung['SynonymeAsTags'] = function() { return renderAsTags(leistung['Synonyme']); }
			leistung['BesondereMerkmaleAsTags'] = function() { return renderAsTags(leistung['Besondere Merkmale']); }

			// add searchString
			let searchString = 'typ ' + leistung['Typ'] + '|'; // allow search by "Typ 1" etc.
			searchString += 'urn:de:fim:leika:leistung:' + leistung['Schluessel'] + '|'; // allow search by urn
			for (key in leistung) {
				if (typeof(leistung[key]) == "string") searchString += leistung[key].toLowerCase() + '|';
			}
			leistung['searchString'] = searchString;
		});

		// sort leika bei date
		leika.sort((a,b) => a.date < b.date);

		// get query from location.hash
		if (location.hash) {
			elSearchInput.value = location.hash.substr(1);
		}

		// show results
		showResults(elSearchInput.value, offset);
	}
});

// update results
function showResults(query, offset) {
	const queryLower = query.toLowerCase();
	let leikaFiltered = leika.filter(item => item['searchString'].indexOf(queryLower) !== -1);
	if (query != "") leikaFiltered.sort((a,b) => a.Schluessel > b.Schluessel);

	// show number of results
	elNumResults.innerText = leikaFiltered.length;

	// clear results section
	if (offset == 0) {
		elResultsSection.innerHTML = '';
	}

	// render results
	for (var i = offset; i < offset + PAGE_SIZE; i++) {
		if (leikaFiltered[i] != undefined) {
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
	location.hash = elSearchInput.value;
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
