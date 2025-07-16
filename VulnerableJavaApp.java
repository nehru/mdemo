import java.io.*;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.Base64;
import java.util.Properties;
import java.util.Random;
import java.util.Scanner;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import org.w3c.dom.Document;

// This class is intentionally insecure for demonstration purposes.
public class VulnerableJavaApp {

    private static final String HARDCODED_USERNAME = "admin"; // Hardcoded credential
    private static final String HARDCODED_PASSWORD = "password123"; // Hardcoded credential
    private static String GLOBAL_SESSION_ID = null; // Insecure session management

    // --- SQL Injection (CWE-89) ---
    public void sqlInjectionVulnerableMethod(String userId, String password) throws SQLException {
        Connection conn = null;
        Statement stmt = null;
        try {
            // Insecure DB connection for demonstration (real app would use a pool)
            conn = DriverManager.getConnection("jdbc:h2:mem:testdb", "sa", "");
            stmt = conn.createStatement();

            // VULNERABILITY: Direct concatenation of user input into SQL query
            String sql = "SELECT * FROM users WHERE id = '" + userId + "' AND password = '" + password + "'";
            System.out.println("Executing SQL (VULNERABLE): " + sql);
            ResultSet rs = stmt.executeQuery(sql);

            if (rs.next()) {
                System.out.println("SQL Injection: User authenticated successfully (or bypassed).");
            } else {
                System.out.println("SQL Injection: Authentication failed.");
            }
        } finally {
            if (stmt != null) stmt.close();
            if (conn != null) conn.close();
        }
    }

    // --- Cross-Site Scripting (XSS) (CWE-79) ---
    // Simulates a simple web endpoint that reflects user input
    public String xssVulnerableServlet(String userInput) {
        // VULNERABILITY: Directly embedding user input into HTML without encoding
        return "<html><body><h1>Hello, " + userInput + "!</h1></body></html>";
    }

    // --- Insecure Deserialization (CWE-502) ---
    // Represents a simple object that can be deserialized
    static class UserSettings implements Serializable {
        private static final long serialVersionUID = 1L;
        public String theme;
        public String language;

        public UserSettings(String theme, String language) {
            this.theme = theme;
            this.language = language;
        }

        @Override
        public String toString() {
            return "UserSettings [theme=" + theme + ", language=" + language + "]";
        }
        
        // VULNERABILITY: Potential for RCE if malicious object is deserialized.
        // This is a common attack vector for untrusted deserialization.
        private void readObject(ObjectInputStream in) throws IOException, ClassNotFoundException {
            in.defaultReadObject();
            System.out.println("Deserialized UserSettings: " + this);
            // Imagine malicious code here, e.g., Runtime.getRuntime().exec(...)
            // For example, if 'theme' contained a command like "calc.exe", and this was
            // a custom deserializer that executed properties directly.
        }
    }

    public void insecureDeserialization(byte[] serializedData) {
        try (ByteArrayInputStream bis = new ByteArrayInputStream(serializedData);
             ObjectInputStream ois = new ObjectInputStream(bis)) {
            // VULNERABILITY: Deserializing untrusted data
            Object obj = ois.readObject();
            System.out.println("Deserialized object: " + obj.getClass().getName());
            // Process the deserialized object (could trigger malicious code from readObject above)
        } catch (IOException | ClassNotFoundException e) {
            System.err.println("Deserialization failed: " + e.getMessage());
            e.printStackTrace(); // Sensitive information exposure in logs
        }
    }

    // --- Path Traversal (CWE-22) ---
    public String readFileVulnerable(String filename) {
        // VULNERABILITY: Allowing user input directly into file path
        // An attacker could use "../" to access arbitrary files.
        File file = new File("./data/" + filename); // Assuming 'data' directory exists
        try {
            return new String(Files.readAllBytes(Paths.get(file.getAbsolutePath())));
        } catch (IOException e) {
            System.err.println("Failed to read file: " + e.getMessage());
            return "Error reading file.";
        }
    }

    // --- Command Injection (CWE-77) ---
    public void executeCommandVulnerable(String command) {
        try {
            // VULNERABILITY: Directly executing user input as a system command
            Process process = Runtime.getRuntime().exec(command);
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            String line;
            while ((line = reader.readLine()) != null) {
                System.out.println("CMD Output: " + line);
            }
            process.waitFor();
        } catch (IOException | InterruptedException e) {
            System.err.println("Command execution failed: " + e.getMessage());
        }
    }

    // --- Hardcoded Credentials (CWE-798) & Broken Authentication (CWE-798, CWE-287) ---
    public boolean loginVulnerable(String username, String password) {
        // VULNERABILITY: Hardcoded credentials
        // VULNERABILITY: Simple string comparison, no hashing, no rate limiting
        if (HARDCODED_USERNAME.equals(username) && HARDCODED_PASSWORD.equals(password)) {
            GLOBAL_SESSION_ID = generateInsecureSessionId(); // Insecure session ID generation
            System.out.println("Login Successful! Session ID: " + GLOBAL_SESSION_ID);
            return true;
        } else {
            System.out.println("Login Failed.");
            return false;
        }
    }

    // --- Insecure Randomness (CWE-330, CWE-338) ---
    public String generateInsecureSessionId() {
        // VULNERABILITY: Using java.util.Random for security-sensitive purposes
        // Predictable, can be brute-forced or guessed.
        Random random = new Random();
        return "SESSION_" + Math.abs(random.nextLong());
    }

    // --- Sensitive Data Exposure (CWE-200) ---
    public void logSensitiveData(String userEmail, String creditCardNumber) {
        // VULNERABILITY: Logging sensitive data
        System.out.println("DEBUG: User Email: " + userEmail + ", Credit Card: " + creditCardNumber);
    }

    // --- XML External Entity (XXE) Injection (CWE-611) ---
    public void parseXmlVulnerable(String xmlInput) {
        try {
            DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
            // VULNERABILITY: DTDs and external entities are enabled by default
            // An attacker can inject external entities (e.g., file:///etc/passwd)
            DocumentBuilder db = dbf.newDocumentBuilder();
            ByteArrayInputStream bis = new ByteArrayInputStream(xmlInput.getBytes());
            Document doc = db.parse(bis);
            System.out.println("Parsed XML: " + doc.getDocumentElement().getNodeName());
        } catch (Exception e) {
            System.err.println("XML parsing failed: " + e.getMessage());
            e.printStackTrace(); // Sensitive information exposure in logs
        }
    }

    // --- Main method to demonstrate vulnerabilities ---
    public static void main(String[] args) throws Exception {
        VulnerableJavaApp app = new VulnerableJavaApp();
        Scanner scanner = new Scanner(System.in);

        System.out.println("--- Demonstrating Java Vulnerabilities ---");

        // 1. SQL Injection
        System.out.println("\n--- SQL Injection Demo ---");
        System.out.print("Enter User ID (try 'admin'--' or 1=1--): ");
        String userId = scanner.nextLine();
        System.out.print("Enter Password (any for bypass): ");
        String password = scanner.nextLine();
        app.sqlInjectionVulnerableMethod(userId, password);

        // 2. XSS
        System.out.println("\n--- XSS Demo ---");
        System.out.print("Enter HTML content for greeting (try <script>alert('XSSed!')</script>): ");
        String xssInput = scanner.nextLine();
        System.out.println("Output HTML (simulate browser rendering): " + app.xssVulnerableServlet(xssInput));

        // 3. Insecure Deserialization
        System.out.println("\n--- Insecure Deserialization Demo ---");
        UserSettings normalSettings = new UserSettings("dark", "en");
        try (ByteArrayOutputStream bos = new ByteArrayOutputStream();
             ObjectOutputStream oos = new ObjectOutputStream(bos)) {
            oos.writeObject(normalSettings);
            byte[] serializedNormal = bos.toByteArray();
            System.out.println("Deserializing normal object:");
            app.insecureDeserialization(serializedNormal);

            // You would craft a malicious payload externally for a real attack
            // For example, using ysoserial to generate a gadget chain.
            // Here's a placeholder for where a malicious payload would go:
            // byte[] maliciousPayload = Base64.getDecoder().decode("rO0ABXNy...");
            // System.out.println("\nAttempting to deserialize malicious object (conceptual):");
            // app.insecureDeserialization(maliciousPayload);
            System.out.println("Note: A real deserialization attack requires a crafted payload and vulnerable libraries.");

        }

        // 4. Path Traversal
        System.out.println("\n--- Path Traversal Demo ---");
        System.out.print("Enter filename to read (try ../../../etc/passwd or ../VulnerableJavaApp.java): ");
        String fileToRead = scanner.nextLine();
        System.out.println("File Content:\n" + app.readFileVulnerable(fileToRead));

        // 5. Command Injection
        System.out.println("\n--- Command Injection Demo ---");
        System.out.print("Enter command to execute (try 'ls' or 'dir', or 'ls; rm -rf /' on Linux): ");
        String commandToExecute = scanner.nextLine();
        app.executeCommandVulnerable(commandToExecute);

        // 6. Hardcoded Credentials & Broken Auth
        System.out.println("\n--- Authentication Demo ---");
        System.out.print("Enter username (try admin): ");
        String authUser = scanner.nextLine();
        System.out.print("Enter password (try password123): ");
        String authPass = scanner.nextLine();
        app.loginVulnerable(authUser, authPass);
        System.out.println("Current Session ID (if logged in): " + GLOBAL_SESSION_ID);

        // 7. Sensitive Data Exposure
        System.out.println("\n--- Sensitive Data Logging Demo ---");
        app.logSensitiveData("test@example.com", "1234-5678-9012-3456");

        // 8. XXE Injection
        System.out.println("\n--- XXE Injection Demo ---");
        String xxePayload =
                "<?xml version=\"1.0\"?>" +
                "<!DOCTYPE foo [<!ENTITY xxe SYSTEM \"file:///etc/passwd\">]>" +
                "<data>&xxe;</data>";
        System.out.println("Parsing XML with XXE payload (should display /etc/passwd content on Linux):\n" + xxePayload);
        app.parseXmlVulnerable(xxePayload);

        scanner.close();
    }
}