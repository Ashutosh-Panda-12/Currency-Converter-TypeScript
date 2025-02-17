const inputBox = document.querySelector<HTMLInputElement>('#input')!;
const fromCurrency = document.querySelector<HTMLSelectElement>('#from-currency')!;
const toCurrency = document.querySelector<HTMLSelectElement>('#to-currency')!;
const convertButton = document.querySelector<HTMLButtonElement>('#convert')!;
const conversion = document.querySelector<HTMLParagraphElement>('#conversion')!;
const error = document.querySelector<HTMLParagraphElement>('#error')!;

function showErrorMessage(message: string): void {
    error.style.display = "block";
    error.textContent = message;
    setTimeout(() => {
        error.style.display = "none";
    }, 3000);
}

interface Country {
    name: { common: string };
    currencies?: Record<string, { name: string }>;
}

async function getCountries(): Promise<Country[] | undefined> {
    try {
        const response = await fetch("https://restcountries.com/v3.1/all?fields=name,currencies");
        if (!response.ok) throw new Error('Error fetching data');
        return await response.json();
    } catch (err) {
        console.error((err as Error).message);
    }
}

function updateCurrency(element: HTMLSelectElement, countries: Country[]): void {
    element.innerHTML = '<option value="">Select Currency</option>';
    countries.sort((a, b) => (a.name.common || '').localeCompare(b.name.common || ''));

    countries.forEach((country) => {
        const currencyCode = Object.keys(country.currencies || {})[0];
        if (currencyCode) {
            const option = document.createElement('option');
            option.textContent = `${currencyCode} - ${country.name.common}`;
            option.value = currencyCode;
            element.appendChild(option);
        }
    });
}

getCountries().then(countries => {
    if (countries) {
        updateCurrency(fromCurrency, countries);
        updateCurrency(toCurrency, countries);
    }
});

function updateOutput(message: string): void {
    conversion.textContent = message;
}

interface ExchangeRateResponse {
    conversion_rates: Record<string, number>;
}

async function exchangeRateValue(fromCurr: string): Promise<ExchangeRateResponse | undefined> {
    try {
        const response = await fetch(`https://v6.exchangerate-api.com/v6/54ea5b93bb203940c261fcb2/latest/${fromCurr}`);
        if (!response.ok) throw new Error("Error fetching the Exchange Rate.");
        return await response.json();
    } catch (err) {
        console.error((err as Error).message);
    }
}

convertButton.addEventListener("click", function (event: Event): void {
    event.preventDefault();

    const selectedFromCurrency = fromCurrency.value;
    const selectedToCurrency = toCurrency.value;
    const inputValue = inputBox.value;

    if (!inputValue) {
        showErrorMessage("Please Enter an Amount");
        inputBox.focus();
        return;
    }

    if (!selectedFromCurrency) {
        showErrorMessage("Please Select First Currency");
        fromCurrency.focus();
        return;
    }

    if (!selectedToCurrency) {
        showErrorMessage("Please Select Second Currency");
        toCurrency.focus();
        return;
    }

    exchangeRateValue(selectedFromCurrency).then(response => {
        if (response && response.conversion_rates) {
            const rate = response.conversion_rates[selectedToCurrency];
            if (rate) {
                updateOutput(`${inputValue} ${selectedFromCurrency} = ${(rate * Number(inputValue)).toFixed(2)} ${selectedToCurrency}`);
            } else {
                showErrorMessage("Conversion rate not available.");
            }
        } else {
            showErrorMessage("Error fetching exchange rate.");
        }
    });
});
