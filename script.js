document.addEventListener('DOMContentLoaded', () => {
    populateStateDropdowns(['sellerState', 'buyerState']);
    document.getElementById('addProduct').addEventListener('click', addProduct);
    document.getElementById('calculateBtn').addEventListener('click', calculateTax);
});

// List of Origin-Based States
const originBasedStates = ["Arizona", "California", "Illinois", "Mississippi", "Missouri", 
                           "New Mexico", "Ohio", "Pennsylvania", "Tennessee", "Texas", 
                           "Utah", "Virginia"];

// Function to determine tax rule type (Origin-Based or Destination-Based)
function getTaxRuleType(sellerState) {
    return originBasedStates.includes(sellerState) ? "Origin-Based" : "Destination-Based";
}

function populateStateDropdowns(selectIds) {
    const states = ["Select State", "Alabama", "Alaska", "Arizona", "Arkansas", "California",
        "Colorado", "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois",
        "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts",
        "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada",
        "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota",
        "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina",
        "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington",
        "West Virginia", "Wisconsin", "Wyoming"
    ];

    selectIds.forEach(selectId => {
        const dropdown = document.getElementById(selectId);
        states.forEach(state => {
            const option = document.createElement("option");
            option.value = state === "Select State" ? "" : state;
            option.textContent = state;
            dropdown.appendChild(option);
        });
    });
}

function addProduct() {
    const productList = document.getElementById("productList");
    const productItem = document.createElement("div");
    productItem.classList.add("product-item");

    productItem.innerHTML = `
        <div class="input-group">
            <label>Product Name:</label>
            <input type="text" class="productName" required>
        </div>
        <div class="input-group">
            <label>Price ($):</label>
            <input type="number" class="productPrice" min="0" step="0.01" required>
        </div>
        <div class="input-group">
            <label>Quantity:</label>
            <input type="number" class="productQuantity" min="1" required>
        </div>
        <div class="input-group">
            <label>Use Custom Tax Rate:</label>
            <input type="checkbox" class="useCustomTax" onchange="toggleCustomTaxInput(this)">
        </div>
        <div class="input-group customTaxGroup" style="display: none;">
            <label>Custom Tax Rate (%):</label>
            <input type="number" class="customTaxRate" min="0" step="0.01">
        </div>
        <button class="removeProduct" onclick="this.parentElement.remove()">Remove</button>
    `;
    
    productList.appendChild(productItem);
}

function toggleCustomTaxInput(checkbox) {
    const customTaxInput = checkbox.closest(".product-item").querySelector(".customTaxGroup");
    const inputField = customTaxInput.querySelector(".customTaxRate");

    if (checkbox.checked) {
        customTaxInput.style.display = "block";
        inputField.setAttribute("required", "true");
        inputField.classList.add("invalid");
    } else {
        customTaxInput.style.display = "none";
        inputField.removeAttribute("required");
        inputField.classList.remove("invalid");
    }
}

async function calculateTax() {
    const deliveryMethod = document.getElementById("deliveryMethod").value;

    if (!deliveryMethod) {
        alert("Please select a delivery method before proceeding.");
        return;
    }

    const products = [...document.querySelectorAll(".product-item")].map(product => {
        const name = product.querySelector(".productName").value.trim();
        const price = parseFloat(product.querySelector(".productPrice").value);
        const quantity = parseInt(product.querySelector(".productQuantity").value);
        const useCustomTax = product.querySelector(".useCustomTax").checked;
        const customTaxInput = product.querySelector(".customTaxRate");

        if (useCustomTax && (!customTaxInput.value || parseFloat(customTaxInput.value) <= 0)) {
            customTaxInput.classList.add("invalid");
            alert("Custom Tax Rate cannot be empty or zero.");
            return null;
        } else {
            customTaxInput.classList.remove("invalid");
        }

        return {
            name,
            price,
            quantity,
            useCustomTax,
            customTaxRate: useCustomTax ? parseFloat(customTaxInput.value) : 0
        };
    });

    if (products.includes(null)) return; // Stop execution if validation fails

    const sellerState = document.getElementById("sellerState").value;
    const buyerState = document.getElementById("buyerState").value;
    const sellerZip = document.getElementById("sellerZip").value.trim();
    const buyerZip = document.getElementById("buyerZip").value.trim();

    // Determine tax rule type (Origin-Based or Destination-Based)
    const taxRuleType = getTaxRuleType(sellerState);

    const requestData = {
        products,
        sellerState,
        sellerZip,
        buyerState,
        buyerZip,
        deliveryMethod,
        taxRuleType
    };

    try {
        const response = await fetch("http://https://voteforme-md-sales-tax.onrender.com/calculate-tax", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Unexpected API error");
        }

        document.getElementById("results").innerHTML = `
            <h3>Final Total</h3>
            <p><strong>Delivery Method:</strong> ${data.deliveryMethod}</p>
            <p><strong>Tax Rule Applied:</strong> ${data.taxRuleType}</p>
            <p><strong>Total Before Tax:</strong> $${data.totalPrice}</p>
            <p><strong>Total Sales Tax:</strong> $${data.totalTax}</p>
            <p><strong>Final Total (After Tax):</strong> $${data.finalTotal}</p>
            <h4>Tax Breakdown</h4>
            <p><strong>State Tax:</strong> $${data.breakdown.stateTax}</p>
            <p><strong>County Tax:</strong> $${data.breakdown.countyTax}</p>
            <p><strong>City Tax:</strong> $${data.breakdown.cityTax}</p>
            <p><strong>Special Tax:</strong> $${data.breakdown.specialTax}</p>
        `;
    } catch (error) {
        console.error("Fetch error:", error);
        document.getElementById("results").innerHTML = `<p style="color:red;">Error: ${error.message}</p>`;
    }
}
