


export class JForm {
    constructor(rootEl, config, onChange) {
        this.rootEl=rootEl;
        this.onChange = onChange;
    }
    build(config) {
        this.rootEl.innerHTML = "";
        Object.entries(config).forEach(([key, initValue]) => {
            const labelEl = document.createElement('label');
            this.rootEl.appendChild(labelEl);
            labelEl.textContent = key;
            const inputEl = document.createElement('input');
            labelEl.appendChild(inputEl);
            inputEl.value = initValue;
            inputEl.addEventListener('change', () => {
                this.onChange(key, inputEl.value);
            });
        });
    }
}