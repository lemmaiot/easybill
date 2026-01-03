
        let currentMode = 'receipt';
        let items = [];
        let itemCounter = 0;

        // Initialize
        document.addEventListener('DOMContentLoaded', function() {
            setupEventListeners();
            addItem(); // Add first item by default
            updatePreview();
        });

        function setupEventListeners() {
            // Mode switching
            document.getElementById('receiptBtn').addEventListener('click', () => switchMode('receipt'));
            document.getElementById('invoiceBtn').addEventListener('click', () => switchMode('invoice'));

            // Add item
            document.getElementById('addItemBtn').addEventListener('click', addItem);

            // VAT checkbox
            document.getElementById('includeVAT').addEventListener('change', () => {
                calculateTotals();
                updatePreview();
            });

            // Generate button
            document.getElementById('generateBtn').addEventListener('click', generateDocument);

            // Action buttons
            document.getElementById('printBtn').addEventListener('click', printDocument);
            document.getElementById('downloadBtn').addEventListener('click', downloadDocument);
            document.getElementById('shareBtn').addEventListener('click', shareDocument);

            // Live preview updates
            const formInputs = ['businessName', 'businessPhone', 'businessEmail', 'businessAddress', 
                               'customerName', 'customerContact', 'paymentStatus', 'paymentMethod', 
                               'dueDate', 'paymentTerms'];
            formInputs.forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    element.addEventListener('input', updatePreview);
                    element.addEventListener('change', updatePreview);
                }
            });
        }

        function switchMode(mode) {
            currentMode = mode;
            const receiptBtn = document.getElementById('receiptBtn');
            const invoiceBtn = document.getElementById('invoiceBtn');
            const paymentSection = document.getElementById('paymentSection');
            const invoiceSection = document.getElementById('invoiceSection');
            const generateBtn = document.getElementById('generateBtn');

            if (mode === 'receipt') {
                receiptBtn.classList.add('bg-indigo-600', 'text-white');
                receiptBtn.classList.remove('bg-gray-200', 'text-gray-700');
                invoiceBtn.classList.add('bg-gray-200', 'text-gray-700');
                invoiceBtn.classList.remove('bg-indigo-600', 'text-white');
                paymentSection.style.display = 'block';
                invoiceSection.style.display = 'none';
                generateBtn.textContent = 'Generate Receipt';
            } else {
                invoiceBtn.classList.add('bg-indigo-600', 'text-white');
                invoiceBtn.classList.remove('bg-gray-200', 'text-gray-700');
                receiptBtn.classList.add('bg-gray-200', 'text-gray-700');
                receiptBtn.classList.remove('bg-indigo-600', 'text-white');
                paymentSection.style.display = 'none';
                invoiceSection.style.display = 'block';
                generateBtn.textContent = 'Generate Invoice';
                
                // Set default due date
                const dueDateInput = document.getElementById('dueDate');
                if (!dueDateInput.value) {
                    const defaultDate = new Date();
                    defaultDate.setDate(defaultDate.getDate() + 30);
                    dueDateInput.value = defaultDate.toISOString().split('T')[0];
                }
            }

            updatePreview();
        }

        function addItem() {
            itemCounter++;
            const itemDiv = document.createElement('div');
            itemDiv.className = 'bg-gray-50 rounded-lg p-3 animate-slide-up';
            itemDiv.id = `item-${itemCounter}`;
            itemDiv.innerHTML = `
                <div class="grid grid-cols-12 gap-2">
                    <input type="text" placeholder="Description" class="col-span-5 px-3 py-2 border border-gray-300 rounded-lg text-sm item-desc">
                    <input type="number" min="1" value="1" class="col-span-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-center item-qty">
                    <input type="number" min="0" step="0.01" placeholder="0.00" class="col-span-3 px-3 py-2 border border-gray-300 rounded-lg text-sm item-price">
                    <button onclick="removeItem(${itemCounter})" class="col-span-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 text-sm font-medium">×</button>
                </div>
            `;
            document.getElementById('itemsList').appendChild(itemDiv);

            items.push({
                id: itemCounter,
                description: '',
                quantity: 1,
                price: 0,
                total: 0
            });

            // Add event listeners
            itemDiv.querySelectorAll('input').forEach(input => {
                input.addEventListener('input', () => {
                    updateItemData(itemCounter);
                    calculateTotals();
                    updatePreview();
                });
            });
        }

        function removeItem(id) {
            const itemDiv = document.getElementById(`item-${id}`);
            if (itemDiv) {
                itemDiv.remove();
                items = items.filter(item => item.id !== id);
                calculateTotals();
                updatePreview();
            }
        }

        function updateItemData(id) {
            const itemDiv = document.getElementById(`item-${id}`);
            if (!itemDiv) return;

            const description = itemDiv.querySelector('.item-desc').value;
            const quantity = parseFloat(itemDiv.querySelector('.item-qty').value) || 0;
            const price = parseFloat(itemDiv.querySelector('.item-price').value) || 0;
            const total = quantity * price;

            const item = items.find(i => i.id === id);
            if (item) {
                item.description = description;
                item.quantity = quantity;
                item.price = price;
                item.total = total;
            }
        }

        function calculateTotals() {
            const subtotal = items.reduce((sum, item) => sum + item.total, 0);
            const includeVAT = document.getElementById('includeVAT').checked;
            const vat = includeVAT ? subtotal * 0.075 : 0;
            const total = subtotal + vat;

            document.getElementById('subtotalDisplay').textContent = formatCurrency(subtotal);
            document.getElementById('vatDisplay').textContent = formatCurrency(vat);
            document.getElementById('totalDisplay').textContent = formatCurrency(total);
        }

        function formatCurrency(amount) {
            return new Intl.NumberFormat('en-NG', {
                style: 'currency',
                currency: 'NGN'
            }).format(amount);
        }

        function generateDocumentNumber() {
            const prefix = currentMode === 'invoice' ? 'INV' : 'REC';
            const timestamp = Date.now().toString().slice(-8);
            return `${prefix}-${timestamp}`;
        }

        function updatePreview() {
            const businessName = document.getElementById('businessName').value || 'Your Business';
            const customerName = document.getElementById('customerName').value || 'Customer Name';
            const docNumber = generateDocumentNumber();
            const date = new Date().toLocaleDateString('en-NG');

            const subtotal = items.reduce((sum, item) => sum + item.total, 0);
            const includeVAT = document.getElementById('includeVAT').checked;
            const vat = includeVAT ? subtotal * 0.075 : 0;
            const total = subtotal + vat;

            let html = `
                <div class="space-y-4">
                    <div class="text-center border-b pb-4">
                        <h1 class="text-2xl font-bold text-gray-900">${businessName}</h1>
                        ${document.getElementById('businessAddress').value ? `<p class="text-sm text-gray-600">${document.getElementById('businessAddress').value}</p>` : ''}
                        ${document.getElementById('businessPhone').value ? `<p class="text-sm text-gray-600">${document.getElementById('businessPhone').value}</p>` : ''}
                        ${document.getElementById('businessEmail').value ? `<p class="text-sm text-gray-600">${document.getElementById('businessEmail').value}</p>` : ''}
                    </div>

                    <div class="text-center">
                        <h2 class="text-xl font-bold text-indigo-600">${currentMode === 'invoice' ? 'INVOICE' : 'RECEIPT'}</h2>
                        <p class="text-sm text-gray-600">#${docNumber}</p>
                        <p class="text-sm text-gray-600">Date: ${date}</p>
                    </div>

                    <div class="border-b pb-4">
                        <p class="text-sm font-medium text-gray-700">Customer: ${customerName}</p>
                        ${document.getElementById('customerContact').value ? `<p class="text-sm text-gray-600">${document.getElementById('customerContact').value}</p>` : ''}
                    </div>

                    <table class="w-full text-sm">
                        <thead class="border-b">
                            <tr>
                                <th class="text-left py-2">Item</th>
                                <th class="text-center py-2">Qty</th>
                                <th class="text-right py-2">Price</th>
                                <th class="text-right py-2">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${items.map(item => `
                                <tr class="border-b">
                                    <td class="py-2">${item.description || 'Item'}</td>
                                    <td class="text-center py-2">${item.quantity}</td>
                                    <td class="text-right py-2">${formatCurrency(item.price)}</td>
                                    <td class="text-right py-2">${formatCurrency(item.total)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>

                    <div class="space-y-1 pt-4">
                        <div class="flex justify-between text-sm">
                            <span>Subtotal:</span>
                            <span>${formatCurrency(subtotal)}</span>
                        </div>
                        ${includeVAT ? `
                            <div class="flex justify-between text-sm">
                                <span>VAT (7.5%):</span>
                                <span>${formatCurrency(vat)}</span>
                            </div>
                        ` : ''}
                        <div class="flex justify-between font-bold text-lg border-t pt-2">
                            <span>Total:</span>
                            <span>${formatCurrency(total)}</span>
                        </div>
                    </div>
            `;

            if (currentMode === 'receipt') {
                const paymentStatus = document.getElementById('paymentStatus').value;
                const paymentMethod = document.getElementById('paymentMethod').value;
                html += `
                    <div class="border-t pt-4 text-sm">
                        <p>Status: <span class="font-medium ${paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'}">${paymentStatus.toUpperCase()}</span></p>
                        <p>Method: <span class="font-medium">${paymentMethod.toUpperCase()}</span></p>
                    </div>
                `;
            }

            html += `
                    <div class="text-center text-xs text-gray-500 border-t pt-4">
                        <p>Thank you for your business!</p>
                    </div>
                </div>
            `;

            document.getElementById('previewArea').innerHTML = html;
        }

        function generateDocument() {
            const businessName = document.getElementById('businessName').value.trim();
            const customerName = document.getElementById('customerName').value.trim();

            if (!businessName) {
                alert('Please enter your business name');
                return;
            }

            if (!customerName) {
                alert('Please enter customer name');
                return;
            }

            if (items.length === 0 || items.every(item => item.total === 0)) {
                alert('Please add at least one item with a price');
                return;
            }

            updatePreview();
            alert(`${currentMode === 'invoice' ? 'Invoice' : 'Receipt'} generated successfully! Use the buttons above to print, download, or share.`);
        }

        function printDocument() {
            const content = document.getElementById('previewArea').innerHTML;
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Print ${currentMode === 'invoice' ? 'Invoice' : 'Receipt'}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { padding: 8px; text-align: left; }
                    </style>
                </head>
                <body>${content}</body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
        }

        async function downloadDocument() {
            const element = document.getElementById('previewArea');
            const canvas = await html2canvas(element, { backgroundColor: '#ffffff' });
            const link = document.createElement('a');
            link.download = `${currentMode}-${generateDocumentNumber()}.png`;
            link.href = canvas.toDataURL();
            link.click();
        }

        function shareDocument() {
            const businessName = document.getElementById('businessName').value || 'Business';
            const customerName = document.getElementById('customerName').value || 'Customer';
            const docNumber = generateDocumentNumber();
            const subtotal = items.reduce((sum, item) => sum + item.total, 0);
            const includeVAT = document.getElementById('includeVAT').checked;
            const vat = includeVAT ? subtotal * 0.075 : 0;
            const total = subtotal + vat;

            const message = `${currentMode.toUpperCase()} from ${businessName}%0A%0A${currentMode.toUpperCase()} #: ${docNumber}%0ACustomer: ${customerName}%0ADate: ${new Date().toLocaleDateString()}%0A%0ATotal: ${formatCurrency(total)}%0A%0AGenerated with EasyBill`;
            
            window.open(`https://wa.me/?text=${message}`, '_blank');
        }