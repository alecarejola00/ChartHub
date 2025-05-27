// ==UserScript==
// @name         MarketWatch Bulk Downloader
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Automatically download MarketWatch data for multiple companies
// @match        https://www.marketwatch.com/investing/stock/*/download-data*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const companySymbols = [
        "HOUSE","BRN","BRNP","BRNPB","BRNPC","ANS","ABA","AEV","AP","ABS","ACEN","ACENA","ACENB","ACE","ANI",
        "ALLDY","HOME","AGI","FOOD","ACR","ALTER","APVI","ALHI","APO","APC","APX","APL","ARA","AREIT","ALCO",
        "ALCPD","ALCPF","AUB","ATI","AT","ATN","ATNB","AB","AXLM","AC","ACPB3","ACPAR","ALI","ALLHC","BALAI",
        "BNCOM","BPI","BSC","BDO","BEL","BC","BCB","BCOR","BLOOM","BHI","BKR","CEB","CEBCP","CLI","CLIA2",
        "CLIA1","CHP","CAT","CEU","CNPF","CPM","CPG","CPGPB","C","CBC","TECH","TCB2A","TCB2C","TCB2D","CREIT",
        "CREC","LAND","CDC","CSB","COAL","COL","CIC","CAB","CNVRG","COSCO","CROWN","CEI","CTS","DNL","DDMPR",
        "DELM","DFNN","PLUS","DWC","DITO","DIZ","DMW","DMC","DHI","DD","DDPR","ECVC","EW","ECP","EEI","EEIPA",
        "EEIPB","EMI","ELI","ENEX","EURO","EVER","FJP","FEU","FERRO","FCG","FDC","FLI","FILRT","FAF","FGEN",
        "FPH","FPI","FRUIT","GEO","GSMI","FNI","GERI","GLO","GMA7","HVN","GPH","GREEN","GTCAP","GTPPB","TUGS",
        "HTI","HI","IMP","IMI","ICT","ION","IPO","IPM","I","IDC","JAS","JGS","JFC","KEEPR","KPH","KPHB","KEP",
        "KPPI","LBC","LC","LCB","LPC","LFM","LODE","LPZ","LSC","LTG","MHC","MVC","MACAY","MAC","MFIN","MBC",
        "MB","MER","MA","MAB","MWC","MFC","MARC","MAXS","MED","MEDIC","MWIDE","MWP2B","MEG","MM","MAH","MAHB",
        "MRSGI","MBT","MG","MONDE","MRC","MREIT","NRCP","XG","NIKL","NI","NOW","OGP","OM","ORE","OPMB","OPM",
        "LOTO","PA","PAL","PMPC","PERC","PCOR","PRF4D","PRF4E","PRF4A","PRF4C","PHR","PX","PBC","PBB","PHES",
        "INFRA","PNB","PRC","RLT","PSB","SEVN","PSE","PTC","OV","WEB","PHN","TEL","PHA","PREIT","PRIM","PRMX",
        "PPC","PGOLD","PXP","ASLAG","REDC","REG","RFM","RCB","RCR","RLC","RRHI","ROCK","RCI","SMC","SMC2I",
        "SMC2F","SMC2J","SMC2K","SMC2L","SMC2N","SMC2O","FB","SBS","SECB","SCC","PIZZA","SHNG","SHLPH","SM",
        "SMPH","SOC","SGI","SPNEC","SPC","SSI","SLI","STN","STI","SLF","SUN","SFI","SGP","T","TFHI","TOPZ",
        "TBGI","UNH","UBP","UPM","URC","UPSON","V","VMC","VLL","VLL2A","VLL2B","STR","VREIT","VITA","VVT",
        "WPI","WIN","WLCON","X","ZHI"
    ];

    const baseURL = "https://www.marketwatch.com/investing/stock/";
    const startDate = new Date(2025, 4, 1);  // May 1, 2025
    const endDate = new Date(2025, 4, 16);   // May 16, 2025

    // Helpers
    function isWeekend(date) {
        return date.getDay() === 6 || date.getDay() === 0;
    }

    function adjustDate(date, isStart = true) {
        const newDate = new Date(date);
        while (isWeekend(newDate)) {
            newDate.setDate(newDate.getDate() + (isStart ? 1 : -1));
        }
        return newDate;
    }

    function formatDate(date) {
        const mm = (date.getMonth() + 1).toString().padStart(2, '0');
        const dd = date.getDate().toString().padStart(2, '0');
        return `${mm}/${dd}/${date.getFullYear()}`;
    }

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function simulateButtonClick() {
        const button = document.querySelector("button[data-track-payload*='Download_Data_Update_Results']");
        if (button) {
            button.click();
            console.log("Clicked 'Update Results'...");
            await delay(2500);
        } else {
            console.log("Update button not found.");
        }
    }

    async function triggerDownload() {
        const link = document.querySelector("a[download][href*='downloaddatapartial']");
        if (link) {
            const evt = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
            link.dispatchEvent(evt);
            console.log("Download triggered.");
            await delay(3000);
        } else {
            console.log("Download link not found.");
        }
    }

    async function processCurrentSymbol() {
        const symbol = window.location.pathname.split("/")[3].toUpperCase();
        console.log(`Processing symbol: ${symbol}`);

        const startStr = formatDate(adjustDate(startDate, true));
        const endStr = formatDate(adjustDate(endDate, false));

        const startInput = document.querySelector("input[name='startdate']");
        const endInput = document.querySelector("input[name='enddate']");

        if (startInput && endInput) {
            startInput.value = startStr;
            endInput.value = endStr;

            await simulateButtonClick();
            await triggerDownload();
        } else {
            console.log("Date inputs not found.");
        }

        // Move to next symbol
        const currentIndex = companySymbols.indexOf(symbol);
        if (currentIndex >= 0 && currentIndex < companySymbols.length - 1) {
            const nextSymbol = companySymbols[currentIndex + 1];
            localStorage.setItem("mw_bulk_index", (currentIndex + 1).toString());
            await delay(1000);
            window.location.href = `${baseURL}${nextSymbol}/download-data?startDate=${startStr}&endDate=${endStr}&countryCode=ph`;
        } else {
            console.log("All symbols processed.");
            localStorage.removeItem("mw_bulk_index");
        }
    }

    window.addEventListener('load', async () => {
        const currentSymbol = window.location.pathname.split("/")[3].toUpperCase();
        const index = localStorage.getItem("mw_bulk_index");

        if (!index && companySymbols.length > 0) {
            localStorage.setItem("mw_bulk_index", "0");
            window.location.href = `${baseURL}${companySymbols[0]}/download-data?startDate=${formatDate(adjustDate(startDate, true))}&endDate=${formatDate(adjustDate(endDate, false))}&countryCode=ph`;
        } else if (index && companySymbols.includes(currentSymbol)) {
            await delay(2000);
            await processCurrentSymbol();
        }
    });
})();
