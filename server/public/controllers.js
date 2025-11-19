class UpdateContent {
    constructor(node) {
        this.node = node;
    }
    async update(response) {
        this.node.innerHTML = await response.text();
    }
}

class ToggleContent {
    constructor(node) {
        this.node = node;
    }
    async toggle(response) {
        const el = document.querySelector("#toggle-content");
        el.classList.toggle("hidden");
    }
    async toggleMouseover(response) {
        const el = document.querySelector("#toggle-content-mouseover");
        el.classList.toggle("hidden");
    }
}

window.UpdateContent = UpdateContent;
window.ToggleContent = ToggleContent;