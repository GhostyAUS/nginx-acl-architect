
<?php
// Simple API handler for NGINX ACL Architect
header('Content-Type: application/json');

// NGINX configuration file path
$nginxConfigPath = '/opt/proxy/nginx.conf';

// Handle different request methods
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Get NGINX configuration
        if (isset($_GET['action']) && $_GET['action'] === 'config') {
            if (file_exists($nginxConfigPath)) {
                $config = file_get_contents($nginxConfigPath);
                echo json_encode(['success' => true, 'data' => $config]);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Configuration file not found']);
            }
        } else {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
        }
        break;
        
    case 'POST':
        // Update NGINX configuration
        if (isset($_POST['action']) && $_POST['action'] === 'saveConfig') {
            $configData = isset($_POST['config']) ? $_POST['config'] : '';
            
            if (empty($configData)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'No configuration data provided']);
                break;
            }
            
            // Create backup
            $backupPath = $nginxConfigPath . '.bak.' . time();
            copy($nginxConfigPath, $backupPath);
            
            // Write new config
            if (file_put_contents($nginxConfigPath, $configData)) {
                // In a real implementation, we would test the NGINX config here
                // For this example, we'll just assume success
                echo json_encode(['success' => true, 'message' => 'Configuration saved successfully']);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Failed to save configuration']);
                
                // Restore backup
                copy($backupPath, $nginxConfigPath);
            }
        } else {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        break;
}
?>
