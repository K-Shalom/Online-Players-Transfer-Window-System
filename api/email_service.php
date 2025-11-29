<?php
/**
 * Email Notification Service for Transfer System
 * Handles sending emails for various transfer events
 */

class EmailService {
    private $conn;
    private $from_email;
    private $from_name;
    private $smtp_host;
    private $smtp_port;
    private $smtp_username;
    private $smtp_password;
    
    public function __construct($conn) {
        $this->conn = $conn;
        // Email configuration (can be moved to config.php)
        $this->from_email = 'noreply@optw-system.com';
        $this->from_name = 'OPTW Transfer System';
        $this->smtp_host = 'localhost'; // Change to your SMTP server
        $this->smtp_port = 587;
        $this->smtp_username = ''; // Your SMTP username
        $this->smtp_password = ''; // Your SMTP password
    }
    
    /**
     * Send email using PHP mail() function (fallback)
     */
    private function sendMail($to, $subject, $message, $headers = '') {
        $default_headers = "MIME-Version: 1.0\r\n";
        $default_headers .= "Content-type: text/html; charset=UTF-8\r\n";
        $default_headers .= "From: {$this->from_name} <{$this->from_email}>\r\n";
        $default_headers .= "Reply-To: {$this->from_email}\r\n";
        
        $full_headers = $headers ? $headers : $default_headers;
        
        return mail($to, $subject, $message, $full_headers);
    }
    
    /**
     * Send transfer offer notification to selling club
     */
    public function sendTransferOfferNotification($offerData) {
        try {
            // Get selling club info
            $stmt = $this->conn->prepare("SELECT c.club_name, u.email, u.name as contact_name 
                                          FROM clubs c 
                                          JOIN users u ON c.user_id = u.user_id 
                                          WHERE c.club_id = ?");
            $stmt->bind_param("i", $offerData['seller_club_id']);
            $stmt->execute();
            $clubInfo = $stmt->get_result()->fetch_assoc();
            
            if (!$clubInfo || !$clubInfo['email']) {
                return false;
            }
            
            $subject = "New Transfer Offer Received - {$offerData['player_name']}";
            $message = $this->getTransferOfferTemplate($offerData, $clubInfo);
            
            return $this->sendMail($clubInfo['email'], $subject, $message);
            
        } catch (Exception $e) {
            error_log("Email sending failed: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Send offer acceptance notification to buying club
     */
    public function sendOfferAcceptanceNotification($offerData) {
        try {
            // Get buying club info
            $stmt = $this->conn->prepare("SELECT c.club_name, u.email, u.name as contact_name 
                                          FROM clubs c 
                                          JOIN users u ON c.user_id = u.user_id 
                                          WHERE c.club_id = ?");
            $stmt->bind_param("i", $offerData['buyer_club_id']);
            $stmt->execute();
            $clubInfo = $stmt->get_result()->fetch_assoc();
            
            if (!$clubInfo || !$clubInfo['email']) {
                return false;
            }
            
            $subject = "Transfer Offer Accepted - {$offerData['player_name']}";
            $message = $this->getOfferAcceptanceTemplate($offerData, $clubInfo);
            
            return $this->sendMail($clubInfo['email'], $subject, $message);
            
        } catch (Exception $e) {
            error_log("Email sending failed: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Send offer rejection notification to buying club
     */
    public function sendOfferRejectionNotification($offerData) {
        try {
            // Get buying club info
            $stmt = $this->conn->prepare("SELECT c.club_name, u.email, u.name as contact_name 
                                          FROM clubs c 
                                          JOIN users u ON c.user_id = u.user_id 
                                          WHERE c.club_id = ?");
            $stmt->bind_param("i", $offerData['buyer_club_id']);
            $stmt->execute();
            $clubInfo = $stmt->get_result()->fetch_assoc();
            
            if (!$clubInfo || !$clubInfo['email']) {
                return false;
            }
            
            $subject = "Transfer Offer Rejected - {$offerData['player_name']}";
            $message = $this->getOfferRejectionTemplate($offerData, $clubInfo);
            
            return $this->sendMail($clubInfo['email'], $subject, $message);
            
        } catch (Exception $e) {
            error_log("Email sending failed: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Send transfer completion notification to both clubs
     */
    public function sendTransferCompletionNotification($transferData) {
        try {
            $notifications_sent = 0;
            
            // Get both clubs' info
            $stmt = $this->conn->prepare("SELECT c.club_name, u.email, u.name as contact_name, 
                                                 CASE WHEN c.club_id = ? THEN 'buyer' ELSE 'seller' END as club_role
                                          FROM clubs c 
                                          JOIN users u ON c.user_id = u.user_id 
                                          WHERE c.club_id IN (?, ?)");
            $stmt->bind_param("iii", $transferData['buyer_club_id'], $transferData['buyer_club_id'], $transferData['seller_club_id']);
            $stmt->execute();
            $clubs = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            
            foreach ($clubs as $club) {
                if (!$club['email']) continue;
                
                $subject = "Transfer Completed - {$transferData['player_name']}";
                $message = $this->getTransferCompletionTemplate($transferData, $club, $club['club_role']);
                
                if ($this->sendMail($club['email'], $subject, $message)) {
                    $notifications_sent++;
                }
            }
            
            return $notifications_sent > 0;
            
        } catch (Exception $e) {
            error_log("Email sending failed: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Send transfer window opening notification
     */
    public function sendTransferWindowOpenNotification($windowData) {
        try {
            // Get all club emails
            $stmt = $this->conn->prepare("SELECT c.club_name, u.email, u.name as contact_name 
                                          FROM clubs c 
                                          JOIN users u ON c.user_id = u.user_id 
                                          WHERE u.email IS NOT NULL AND u.email != ''");
            $stmt->execute();
            $clubs = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            
            $notifications_sent = 0;
            foreach ($clubs as $club) {
                if (!$club['email']) continue;
                
                $subject = "Transfer Window Now Open";
                $message = $this->getTransferWindowOpenTemplate($windowData, $club);
                
                if ($this->sendMail($club['email'], $subject, $message)) {
                    $notifications_sent++;
                }
            }
            
            return $notifications_sent;
            
        } catch (Exception $e) {
            error_log("Email sending failed: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Send transfer window closing notification
     */
    public function sendTransferWindowClosingNotification($windowData) {
        try {
            // Get all club emails
            $stmt = $this->conn->prepare("SELECT c.club_name, u.email, u.name as contact_name 
                                          FROM clubs c 
                                          JOIN users u ON c.user_id = u.user_id 
                                          WHERE u.email IS NOT NULL AND u.email != ''");
            $stmt->execute();
            $clubs = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            
            $notifications_sent = 0;
            foreach ($clubs as $club) {
                if (!$club['email']) continue;
                
                $subject = "Transfer Window Closing Soon";
                $message = $this->getTransferWindowClosingTemplate($windowData, $club);
                
                if ($this->sendMail($club['email'], $subject, $message)) {
                    $notifications_sent++;
                }
            }
            
            return $notifications_sent;
            
        } catch (Exception $e) {
            error_log("Email sending failed: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Email template for transfer offers
     */
    private function getTransferOfferTemplate($offerData, $clubInfo) {
        $amount = number_format($offerData['offered_amount'], 2);
        $deadline = date('Y-m-d H:i:s', strtotime('+72 hours'));
        
        return "
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #1976d2; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f9f9f9; }
                .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
                .btn { display: inline-block; padding: 12px 24px; background: #28a745; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
                .details { background: white; padding: 15px; border-left: 4px solid #1976d2; margin: 15px 0; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>📋 New Transfer Offer Received</h1>
                </div>
                <div class='content'>
                    <p>Dear {$clubInfo['contact_name']},</p>
                    <p>You have received a new transfer offer for one of your players:</p>
                    
                    <div class='details'>
                        <h3>🏃 Player Details</h3>
                        <p><strong>Player:</strong> {$offerData['player_name']}</p>
                        <p><strong>Position:</strong> {$offerData['position']}</p>
                        <p><strong>Age:</strong> {$offerData['age']}</p>
                    </div>
                    
                    <div class='details'>
                        <h3>💰 Offer Details</h3>
                        <p><strong>Offer Amount:</strong> \${$amount}</p>
                        <p><strong>Transfer Type:</strong> {$offerData['transfer_type']}</p>
                        <p><strong>From Club:</strong> {$offerData['buyer_club']}</p>
                        <p><strong>Offer Date:</strong> " . date('Y-m-d H:i:s') . "</p>
                        <p><strong>Response Deadline:</strong> {$deadline}</p>
                    </div>
                    
                    <p>Please log in to your dashboard to review and respond to this offer:</p>
                    <p><a href='http://localhost/Online-Players-Transfer-Window-System/login' class='btn'>Login to Dashboard</a></p>
                    
                    <p><strong>Note:</strong> This offer will automatically expire if no response is received within 72 hours.</p>
                </div>
                <div class='footer'>
                    <p>This is an automated message from the Online Players Transfer Window System.</p>
                    <p>© 2025 OPTW System. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>";
    }
    
    /**
     * Email template for offer acceptance
     */
    private function getOfferAcceptanceTemplate($offerData, $clubInfo) {
        $amount = number_format($offerData['offered_amount'], 2);
        
        return "
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #28a745; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f9f9f9; }
                .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
                .btn { display: inline-block; padding: 12px 24px; background: #1976d2; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
                .details { background: white; padding: 15px; border-left: 4px solid #28a745; margin: 15px 0; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>🎉 Transfer Offer Accepted!</h1>
                </div>
                <div class='content'>
                    <p>Dear {$clubInfo['contact_name']},</p>
                    <p>Great news! Your transfer offer has been accepted:</p>
                    
                    <div class='details'>
                        <h3>🏃 Player Details</h3>
                        <p><strong>Player:</strong> {$offerData['player_name']}</p>
                        <p><strong>Position:</strong> {$offerData['position']}</p>
                    </div>
                    
                    <div class='details'>
                        <h3>💰 Transfer Details</h3>
                        <p><strong>Transfer Fee:</strong> \${$amount}</p>
                        <p><strong>Selling Club:</strong> {$offerData['seller_club']}</p>
                        <p><strong>Acceptance Date:</strong> " . date('Y-m-d H:i:s') . "</p>
                    </div>
                    
                    <p>The transfer will be processed and the player will join your squad. You can view the transfer details in your dashboard:</p>
                    <p><a href='http://localhost/Online-Players-Transfer-Window-System/login' class='btn'>View Transfer Details</a></p>
                    
                    <p>Congratulations on your new signing!</p>
                </div>
                <div class='footer'>
                    <p>This is an automated message from the Online Players Transfer Window System.</p>
                    <p>© 2025 OPTW System. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>";
    }
    
    /**
     * Email template for offer rejection
     */
    private function getOfferRejectionTemplate($offerData, $clubInfo) {
        return "
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f9f9f9; }
                .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
                .btn { display: inline-block; padding: 12px 24px; background: #1976d2; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
                .details { background: white; padding: 15px; border-left: 4px solid #dc3545; margin: 15px 0; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>❌ Transfer Offer Rejected</h1>
                </div>
                <div class='content'>
                    <p>Dear {$clubInfo['contact_name']},</p>
                    <p>We regret to inform you that your transfer offer has been rejected:</p>
                    
                    <div class='details'>
                        <h3>🏃 Player Details</h3>
                        <p><strong>Player:</strong> {$offerData['player_name']}</p>
                        <p><strong>Position:</strong> {$offerData['position']}</p>
                    </div>
                    
                    <div class='details'>
                        <h3>💰 Offer Details</h3>
                        <p><strong>Offer Amount:</strong> \$" . number_format($offerData['offered_amount'], 2) . "</p>
                        <p><strong>Selling Club:</strong> {$offerData['seller_club']}</p>
                        <p><strong>Rejection Date:</strong> " . date('Y-m-d H:i:s') . "</p>
                    </div>
                    
                    <p>Don't be discouraged! There are many other talented players available in the transfer market. You can browse and make new offers:</p>
                    <p><a href='http://localhost/Online-Players-Transfer-Window-System/login' class='btn'>Browse Player Market</a></p>
                    
                    <p>Good luck with your transfer activities!</p>
                </div>
                <div class='footer'>
                    <p>This is an automated message from the Online Players Transfer Window System.</p>
                    <p>© 2025 OPTW System. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>";
    }
    
    /**
     * Email template for transfer completion
     */
    private function getTransferCompletionTemplate($transferData, $clubInfo, $role) {
        $amount = number_format($transferData['amount'], 2);
        
        if ($role === 'buyer') {
            $title = "🎉 Transfer Completed - New Player Joined!";
            $message = "Congratulations! The transfer has been completed and the player has joined your squad.";
        } else {
            $title = "✅ Transfer Completed - Player Transferred";
            $message = "The transfer has been completed and the player has been transferred to the buying club.";
        }
        
        return "
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #6f42c1; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f9f9f9; }
                .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
                .btn { display: inline-block; padding: 12px 24px; background: #1976d2; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
                .details { background: white; padding: 15px; border-left: 4px solid #6f42c1; margin: 15px 0; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>{$title}</h1>
                </div>
                <div class='content'>
                    <p>Dear {$clubInfo['contact_name']},</p>
                    <p>{$message}</p>
                    
                    <div class='details'>
                        <h3>🏃 Player Details</h3>
                        <p><strong>Player:</strong> {$transferData['player_name']}</p>
                        <p><strong>Position:</strong> {$transferData['position']}</p>
                    </div>
                    
                    <div class='details'>
                        <h3>💰 Transfer Details</h3>
                        <p><strong>Transfer Fee:</strong> \${$amount}</p>
                        <p><strong>Transfer Type:</strong> {$transferData['type']}</p>
                        <p><strong>Completion Date:</strong> " . date('Y-m-d H:i:s') . "</p>";
        
        if ($role === 'buyer') {
            $content .= "<p><strong>Selling Club:</strong> {$transferData['seller_club']}</p>";
        } else {
            $content .= "<p><strong>Buying Club:</strong> {$transferData['buyer_club']}</p>";
        }
        
        $content .= "
                    </div>
                    
                    <p>A transfer agreement PDF has been generated and stored in the system:</p>
                    <p><a href='http://localhost/Online-Players-Transfer-Window-System/login' class='btn'>View Transfer Agreement</a></p>
                    
                    <p>Thank you for using the OPTW Transfer System!</p>
                </div>
                <div class='footer'>
                    <p>This is an automated message from the Online Players Transfer Window System.</p>
                    <p>© 2025 OPTW System. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>";
        
        return $content;
    }
    
    /**
     * Email template for transfer window opening
     */
    private function getTransferWindowOpenTemplate($windowData, $clubInfo) {
        return "
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #28a745; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f9f9f9; }
                .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
                .btn { display: inline-block; padding: 12px 24px; background: #1976d2; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
                .details { background: white; padding: 15px; border-left: 4px solid #28a745; margin: 15px 0; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>🚀 Transfer Window Now Open!</h1>
                </div>
                <div class='content'>
                    <p>Dear {$clubInfo['contact_name']},</p>
                    <p>The transfer window is now open! You can make offers for players and manage your transfers:</p>
                    
                    <div class='details'>
                        <h3>📅 Window Details</h3>
                        <p><strong>Opening Date:</strong> {$windowData['start_at']}</p>
                        <p><strong>Closing Date:</strong> {$windowData['end_at']}</p>
                        <p><strong>Status:</strong> Open for Business</p>
                    </div>
                    
                    <p>Don't miss this opportunity to strengthen your squad! Browse the player market and make your moves:</p>
                    <p><a href='http://localhost/Online-Players-Transfer-Window-System/login' class='btn'>Go to Transfer Market</a></p>
                    
                    <p>Good luck with your transfer activities!</p>
                </div>
                <div class='footer'>
                    <p>This is an automated message from the Online Players Transfer Window System.</p>
                    <p>© 2025 OPTW System. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>";
    }
    
    /**
     * Email template for transfer window closing
     */
    private function getTransferWindowClosingTemplate($windowData, $clubInfo) {
        return "
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #ffc107; color: #333; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f9f9f9; }
                .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
                .btn { display: inline-block; padding: 12px 24px; background: #dc3545; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
                .details { background: white; padding: 15px; border-left: 4px solid #ffc107; margin: 15px 0; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>⏰ Transfer Window Closing Soon!</h1>
                </div>
                <div class='content'>
                    <p>Dear {$clubInfo['contact_name']},</p>
                    <p>This is a reminder that the transfer window is closing soon. Complete your transfer activities before it's too late:</p>
                    
                    <div class='details'>
                        <h3>📅 Window Details</h3>
                        <p><strong>Closing Date:</strong> {$windowData['end_at']}</p>
                        <p><strong>Time Remaining:</strong> Limited time left!</p>
                        <p><strong>Status:</strong> Closing Soon</p>
                    </div>
                    
                    <p>Make your final transfer moves now:</p>
                    <p><a href='http://localhost/Online-Players-Transfer-Window-System/login' class='btn'>Make Final Transfers</a></p>
                    
                    <p>Don't wait until the last minute!</p>
                </div>
                <div class='footer'>
                    <p>This is an automated message from the Online Players Transfer Window System.</p>
                    <p>© 2025 OPTW System. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>";
    }
}
?>
