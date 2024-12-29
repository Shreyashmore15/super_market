var productPrices = {};

$(function () {
    // Json data by API call for the order table
    $.get(productListApiUrl, function (response) {
        productPrices = {};
        if (response) {
            var options = '<option value="">--Select--</option>';
            $.each(response, function (index, product) {
                options += '<option value="' + product.product_id + '">' + product.name + '</option>';
                productPrices[product.product_id] = product.price_per_unit;
            });
            $(".product-box").find("select").empty().html(options);
        }
    });
});

$("#addMoreButton").click(function () {
    var row = $(".product-box").html();
    $(".product-box-extra").append(row);
    $(".product-box-extra .remove-row").last().removeClass('hideit');
    $(".product-box-extra .product-price").last().text('0.0');
    $(".product-box-extra .product-qty").last().val('1');
    $(".product-box-extra .product-total").last().text('0.0');
});

$(document).on("click", ".remove-row", function () {
    $(this).closest('.row').remove();
    calculateValue();
});

$(document).on("change", ".cart-product", function () {
    var product_id = $(this).val();
    var price = productPrices[product_id];

    $(this).closest('.row').find('#product_price').val(price);
    calculateValue();
});

$(document).on("change", ".product-qty", function () {
    calculateValue();
});

// Add event listener to manually updated item total
$(document).on("change", ".product-total", function () {
    calculateValue();
});

$("#saveOrder").on("click", function () {
    var customerName = $("#customerName").val().trim(); // Get the customer name
    var errorMessage = "";

    // Validate customer name
    if (!customerName) {
        errorMessage = "Customer name is required.";
    } else if (customerName.length < 3) {
        errorMessage = "Customer name must be at least 3 characters long.";
    } else if (!/^[a-zA-Z\s]+$/.test(customerName)) {
        errorMessage = "Customer name should only contain letters and spaces.";
    }

    if (errorMessage) {
        alert(errorMessage);
        return false;
    }

    // Proceed with saving the order
    var formData = $("form").serializeArray();
    var requestPayload = {
        customer_name: customerName,
        total: null,
        order_details: []
    };

    for (var i = 0; i < formData.length; ++i) {
        var element = formData[i];
        var lastElement = null;

        switch (element.name) {
            case 'customerName':
                requestPayload.customer_name = element.value;
                break;
            case 'product_grand_total':
                requestPayload.grand_total = element.value;
                break;
            case 'product':
                requestPayload.order_details.push({
                    product_id: element.value,
                    quantity: null,
                    total_price: null
                });
                break;
            case 'qty':
                lastElement = requestPayload.order_details[requestPayload.order_details.length - 1];
                lastElement.quantity = element.value;
                break;
            case 'item_total':
                lastElement = requestPayload.order_details[requestPayload.order_details.length - 1];
                lastElement.total_price = element.value;
                break;
        }
    }

    callApi("POST", orderSaveApiUrl, {
        'data': JSON.stringify(requestPayload)
    }).then(function (response) {
        if (response && response.message === 'Order saved successfully') {
            // Show success modal
            $('#orderSuccessModal').modal('show');
        } else {
            alert("Failed to save the order.");
        }
    }).catch(function (error) {
        console.error("Error saving order:", error);
        alert("Error occurred while saving the order.");
    });
});

// Function to calculate grand total
function calculateValue() {
    var grandTotal = 0;

    $(".product-box-extra .product-total").each(function () {
        var itemTotal = parseFloat($(this).val()) || 0; // Get item total value
        grandTotal += itemTotal;
    });

    // Update grand total in the UI
    $("#product_grand_total").val(grandTotal.toFixed(2));
}
