# Lab 9: Read XML Data and Display in Tabular Format

A web application designed to read employee information from an XML file (`employees.xml`) and dynamically render it in a styled HTML table with search/filtering capabilities.

---

## 📁 Project Structure

| File | Description |
| :--- | :--- |
| [`employees.xml`](./employees.xml) | XML dataset storing employee records (ID, name, department, designation, email, phone, salary, joining date). |
| [`index.html`](./index.html) | Main HTML5 structure containing table headers, control buttons, status indicators, and search bar. |
| [`style.css`](./style.css) | Modern, responsive CSS styling with zebra striping, department badges, and card UI. |
| [`script.js`](./script.js) | JavaScript logic for reading, parsing (via `DOMParser`), DOM rendering, and real-time search filtering. |

---

## 🚀 How to Run the Application

### Option 1: Using a Local Web Server (Recommended)
Because modern browsers enforce **CORS** restrictions on `file:///` URLs when making `fetch()` or `XMLHttpRequest` calls, running through a local server is the standard web development practice:

1. **Using Python**:
   Open a terminal in this directory and run:
   ```bash
   python -m http.server 8000
   ```
   Then open `http://localhost:8000` in your browser.

2. **Using VS Code Live Server**:
   Right-click `index.html` in VS Code and select **"Open with Live Server"**.

### Option 2: Directly Opening in Browser (`file:///`)
If you double-click `index.html` to open it directly:
- Click the **"Choose XML File"** button on the page.
- Select `employees.xml` from this folder.
- The `FileReader` API will read and render the table immediately without triggering CORS security blocks.

---

## 🔍 Key Technical Concepts (For Lab Viva / Examination)

### 1. XML Structure
```xml
<company>
    <employee id="EMP101">
        <name>Alice Johnson</name>
        <department>Engineering</department>
        <designation>Senior Software Engineer</designation>
        <email>alice.johnson@example.com</email>
        <phone>+1 (555) 019-2834</phone>
        <salary>85000</salary>
        <joiningDate>2021-03-15</joiningDate>
    </employee>
</company>
```

### 2. Reading XML with `fetch()` & `DOMParser`
```javascript
const response = await fetch('employees.xml');
const xmlText = await response.text();

// Convert raw text into an XML DOM document
const parser = new DOMParser();
const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

// Retrieve all employee elements
const employees = xmlDoc.getElementsByTagName('employee');
```

### 3. Extracting Elements and Attributes
- **Attribute**: `emp.getAttribute('id')`
- **Child Tag**: `emp.getElementsByTagName('name')[0].textContent`
