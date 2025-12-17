const API_KEY = "df288330a7b3eec19196088a";
const BASE_URL = `https://v6.exchangerate-api.com/v6/${API_KEY}`;

// Маппинг кодов (для некоторых валют код страны отличается от кода валюты)
const countryCodes = {
    "USD":"US","SGD":"SG","RUB":"RU","EUR":"EU","GBP":"GB","JPY":"JP",
    "KZT":"KZ","UAH":"UA","CNY":"CN","TRY":"TR","BYN":"BY","CAD":"CA",
    "AUD":"AU","CHF":"CH","INR":"IN","BRL":"BR","KRW":"KR"
};

let allCurrencies = [];

async function init() {
    try {
        const res = await fetch(`${BASE_URL}/codes`);
        const data = await res.json();
        allCurrencies = data.supported_codes;
        
        setupDropdown('from-select', 'USD');
        setupDropdown('to-select', 'SGD');
        getRate();
    } catch (e) {
        document.getElementById('rate-display').textContent = "Ошибка API";
    }
}

function setupDropdown(id, defaultCode) {
    const el = document.getElementById(id);
    const trigger = el.querySelector('.select-trigger');
    const dropdown = el.querySelector('.dropdown');
    const list = el.querySelector('.options-list');
    const search = el.querySelector('.search-box');

    // --- ИСПРАВЛЕННАЯ ФУНКЦИЯ ОБНОВЛЕНИЯ ФЛАГА ---
    const updateFlag = (code) => {
        // Получаем код страны
        const country = countryCodes[code] || code.substring(0,2);
        
        // ВАЖНО: Используем toLowerCase(), так как в ссылке нужны маленькие буквы
        // ВАЖНО: Ссылка ведет на библиотеку circle-flags (круглые SVG)
        trigger.querySelector('.flag').src = `https://hatscripts.github.io/circle-flags/flags/${country.toLowerCase()}.svg`;
    };
    
    // При первой загрузке тоже проверяем флаг
    updateFlag(defaultCode);

    trigger.onclick = (e) => {
        e.stopPropagation();
        document.querySelectorAll('.dropdown').forEach(d => d !== dropdown && d.classList.remove('show'));
        dropdown.classList.toggle('show');
        search.value = "";
        search.focus();
        render();
    };

    const render = (filter = "") => {
        list.innerHTML = "";
        const filtered = allCurrencies.filter(c => c[0].toLowerCase().includes(filter.toLowerCase()) || c[1].toLowerCase().includes(filter.toLowerCase()));
        
        if (filtered.length === 0) {
            list.innerHTML = "<div style='padding: 10px; color: var(--text-muted);'>Ничего не найдено</div>";
            return;
        }

        filtered.forEach(([code, name]) => {
                const item = document.createElement('div');
                item.textContent = `${code} - ${name}`;
                item.onclick = () => {
                    trigger.querySelector('.code').textContent = code;
                    updateFlag(code); // Вызываем исправленную функцию
                    dropdown.classList.remove('show');
                    getRate();
                };
                list.appendChild(item);
            });
    };

    search.oninput = (e) => render(e.target.value);
    search.onclick = (e) => e.stopPropagation();
}

async function getRate() {
    const from = document.querySelector('#from-select .code').textContent;
    const to = document.querySelector('#to-select .code').textContent;
    const amountInput = document.getElementById('amount-input');
    const amount = amountInput.value || 0;
    const rateDisplay = document.getElementById('rate-display');

    rateDisplay.textContent = "Обновление...";
    document.querySelector('.converter-card').style.opacity = "0.9";

    try {
        const res = await fetch(`${BASE_URL}/pair/${from}/${to}`);
        const data = await res.json();
        const rate = data.conversion_rate;
        
        const result = (amount * rate).toLocaleString('ru-RU', {minimumFractionDigits: 2, maximumFractionDigits: 2});
        document.getElementById('result-input').value = result;
        rateDisplay.textContent = `1 ${from} = ${rate.toFixed(4)} ${to}`;
    } catch (e) {
        rateDisplay.textContent = "Ошибка сети";
    } finally {
         document.querySelector('.converter-card').style.opacity = "1";
    }
}

document.getElementById('theme-toggle').onclick = () => {
    const root = document.documentElement;
    const isDark = root.getAttribute('data-theme') === 'dark';
    root.setAttribute('data-theme', isDark ? 'light' : 'dark');
    document.getElementById('theme-toggle').textContent = isDark ? '🌙' : '☀️';
};

document.getElementById('swap-btn').onclick = function() {
    const fCode = document.querySelector('#from-select .code');
    const tCode = document.querySelector('#to-select .code');
    const fFlag = document.querySelector('#from-select .flag');
    const tFlag = document.querySelector('#to-select .flag');

    // Меняем текст
    const tempCode = fCode.textContent;
    fCode.textContent = tCode.textContent;
    tCode.textContent = tempCode;

    // Меняем картинки (src)
    const tempSrc = fFlag.src;
    fFlag.src = tFlag.src;
    tFlag.src = tempSrc;

    getRate();
};

window.onclick = () => document.querySelectorAll('.dropdown').forEach(d => d.classList.remove('show'));

let timeout;
document.getElementById('amount-input').oninput = () => {
    clearTimeout(timeout);
    timeout = setTimeout(getRate, 500);
};

init();