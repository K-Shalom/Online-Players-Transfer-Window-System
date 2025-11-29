<?php
/**
 * Fraud Detection System for Transfer System
 * Detects suspicious activities and patterns
 */

class FraudDetection {
    private $conn;
    private $suspicious_activities = [];
    
    public function __construct($conn) {
        $this->conn = $conn;
    }
    
    /**
     * Validate transfer data for potential fraud
     */
    public function validateTransferData($transferData) {
        $violations = [];
        
        // Check for duplicate player profiles
        $duplicateCheck = $this->checkDuplicatePlayer($transferData);
        if ($duplicateCheck['suspicious']) {
            $violations[] = $duplicateCheck;
        }
        
        // Check for inflated market values
        $inflatedCheck = $this->checkInflatedValue($transferData);
        if ($inflatedCheck['suspicious']) {
            $violations[] = $inflatedCheck;
        }
        
        // Check for multiple bids from same club
        $multipleBidsCheck = $this->checkMultipleBids($transferData);
        if ($multipleBidsCheck['suspicious']) {
            $violations[] = $multipleBidsCheck;
        }
        
        // Check for unusual patterns
        $patternCheck = $this->checkUnusualPatterns($transferData);
        if ($patternCheck['suspicious']) {
            $violations[] = $patternCheck;
        }
        
        // Log violations if any found
        if (!empty($violations)) {
            $this->logSuspiciousActivity($transferData, $violations);
        }
        
        return [
            'valid' => empty($violations),
            'violations' => $violations,
            'risk_score' => $this->calculateRiskScore($violations)
        ];
    }
    
    /**
     * Check for duplicate player profiles
     */
    private function checkDuplicatePlayer($transferData) {
        if (!isset($transferData['player_name']) || !isset($transferData['age']) || !isset($transferData['nationality'])) {
            return ['suspicious' => false];
        }
        
        $stmt = $this->conn->prepare("
            SELECT COUNT(*) as count, GROUP_CONCAT(player_id) as player_ids 
            FROM players 
            WHERE name = ? AND age = ? AND nationality = ? AND player_id != ?
        ");
        $stmt->bind_param("sisi", $transferData['player_name'], $transferData['age'], $transferData['nationality'], $transferData['player_id'] ?? 0);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();
        
        if ($result['count'] > 0) {
            return [
                'suspicious' => true,
                'type' => 'duplicate_player',
                'severity' => 'high',
                'description' => 'Duplicate player profile detected',
                'details' => "Found {$result['count']} similar player(s) with same name, age, and nationality",
                'player_ids' => $result['player_ids']
            ];
        }
        
        return ['suspicious' => false];
    }
    
    /**
     * Check for inflated market values
     */
    private function checkInflatedValue($transferData) {
        if (!isset($transferData['market_value']) || !isset($transferData['offered_amount'])) {
            return ['suspicious' => false];
        }
        
        $marketValue = floatval($transferData['market_value']);
        $offeredAmount = floatval($transferData['offered_amount']);
        
        // Calculate inflation percentage
        $inflationPercentage = (($offeredAmount - $marketValue) / $marketValue) * 100;
        
        // Check for suspicious inflation (more than 200% of market value)
        if ($inflationPercentage > 200) {
            return [
                'suspicious' => true,
                'type' => 'inflated_value',
                'severity' => $inflationPercentage > 500 ? 'high' : 'medium',
                'description' => 'Suspiciously high transfer offer detected',
                'details' => "Offer is {$inflationPercentage}% above market value",
                'market_value' => $marketValue,
                'offered_amount' => $offeredAmount,
                'inflation_percentage' => round($inflationPercentage, 2)
            ];
        }
        
        return ['suspicious' => false];
    }
    
    /**
     * Check for multiple bids from same club
     */
    private function checkMultipleBids($transferData) {
        if (!isset($transferData['buyer_club_id']) || !isset($transferData['player_id'])) {
            return ['suspicious' => false];
        }
        
        $buyerClubId = intval($transferData['buyer_club_id']);
        $playerId = intval($transferData['player_id']);
        
        // Check for multiple offers from same club for same player in last 24 hours
        $stmt = $this->conn->prepare("
            SELECT COUNT(*) as offer_count, 
                   GROUP_CONCAT(offer_id) as offer_ids,
                   MAX(created_at) as last_offer_time
            FROM offers 
            WHERE buyer_club_id = ? AND player_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        ");
        $stmt->bind_param("ii", $buyerClubId, $playerId);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();
        
        if ($result['offer_count'] > 2) {
            return [
                'suspicious' => true,
                'type' => 'multiple_bids',
                'severity' => $result['offer_count'] > 5 ? 'high' : 'medium',
                'description' => 'Multiple offers from same club detected',
                'details' => "{$result['offer_count']} offers in last 24 hours",
                'offer_count' => $result['offer_count'],
                'offer_ids' => $result['offer_ids'],
                'last_offer_time' => $result['last_offer_time']
            ];
        }
        
        return ['suspicious' => false];
    }
    
    /**
     * Check for unusual patterns
     */
    private function checkUnusualPatterns($transferData) {
        $violations = [];
        
        // Check for rapid-fire transfers from same club
        if (isset($transferData['seller_club_id'])) {
            $rapidTransferCheck = $this->checkRapidTransfers($transferData['seller_club_id']);
            if ($rapidTransferCheck['suspicious']) {
                $violations[] = $rapidTransferCheck;
            }
        }
        
        // Check for unusual player age patterns
        if (isset($transferData['age'])) {
            $ageCheck = $this->checkUnusualAge($transferData['age']);
            if ($ageCheck['suspicious']) {
                $violations[] = $ageCheck;
            }
        }
        
        // Check for suspicious timing patterns
        $timingCheck = $this->checkSuspiciousTiming();
        if ($timingCheck['suspicious']) {
            $violations[] = $timingCheck;
        }
        
        if (!empty($violations)) {
            return [
                'suspicious' => true,
                'type' => 'unusual_patterns',
                'severity' => 'medium',
                'description' => 'Unusual activity patterns detected',
                'details' => 'Multiple suspicious patterns identified',
                'violations' => $violations
            ];
        }
        
        return ['suspicious' => false];
    }
    
    /**
     * Check for rapid transfers from same club
     */
    private function checkRapidTransfers($clubId) {
        $stmt = $this->conn->prepare("
            SELECT COUNT(*) as transfer_count,
                   GROUP_CONCAT(transfer_id) as transfer_ids
            FROM transfers 
            WHERE seller_club_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
            AND status != 'rejected'
        ");
        $stmt->bind_param("i", $clubId);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();
        
        if ($result['transfer_count'] > 3) {
            return [
                'suspicious' => true,
                'type' => 'rapid_transfers',
                'description' => 'Rapid transfer activity detected',
                'details' => "{$result['transfer_count']} transfers in 1 hour",
                'transfer_count' => $result['transfer_count']
            ];
        }
        
        return ['suspicious' => false];
    }
    
    /**
     * Check for unusual age patterns
     */
    private function checkUnusualAge($age) {
        $age = intval($age);
        
        // Flag very young or very old players
        if ($age < 16 || $age > 45) {
            return [
                'suspicious' => true,
                'type' => 'unusual_age',
                'description' => 'Unusual player age detected',
                'details' => "Player age {$age} is outside normal range",
                'age' => $age
            ];
        }
        
        return ['suspicious' => false];
    }
    
    /**
     * Check for suspicious timing patterns
     */
    private function checkSuspiciousTiming() {
        $currentHour = intval(date('H'));
        
        // Check for activity during unusual hours (2 AM - 5 AM)
        if ($currentHour >= 2 && $currentHour <= 5) {
            return [
                'suspicious' => true,
                'type' => 'unusual_timing',
                'description' => 'Activity during unusual hours',
                'details' => "Transfer activity at {$currentHour}:00",
                'hour' => $currentHour
            ];
        }
        
        return ['suspicious' => false];
    }
    
    /**
     * Calculate overall risk score
     */
    private function calculateRiskScore($violations) {
        $score = 0;
        $weights = [
            'high' => 10,
            'medium' => 5,
            'low' => 2
        ];
        
        foreach ($violations as $violation) {
            $severity = $violation['severity'] ?? 'medium';
            $score += $weights[$severity] ?? 5;
        }
        
        return min($score, 100); // Cap at 100
    }
    
    /**
     * Log suspicious activity
     */
    private function logSuspiciousActivity($transferData, $violations) {
        $riskScore = $this->calculateRiskScore($violations);
        
        $stmt = $this->conn->prepare("
            INSERT INTO fraud_alerts 
            (transfer_id, player_id, buyer_club_id, seller_club_id, risk_score, violations, alert_type, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        
        $transferId = $transferData['transfer_id'] ?? null;
        $playerId = $transferData['player_id'] ?? null;
        $buyerClubId = $transferData['buyer_club_id'] ?? null;
        $sellerClubId = $transferData['seller_club_id'] ?? null;
        $violationsJson = json_encode($violations);
        $alertType = 'suspicious_activity';
        
        $stmt->bind_param("iiiidss", $transferId, $playerId, $buyerClubId, $sellerClubId, $riskScore, $violationsJson, $alertType);
        $stmt->execute();
        
        // If high risk, create admin notification
        if ($riskScore >= 20) {
            $this->createAdminNotification($transferData, $violations, $riskScore);
        }
    }
    
    /**
     * Create admin notification for high-risk activities
     */
    private function createAdminNotification($transferData, $violations, $riskScore) {
        $message = "High-risk transfer activity detected (Risk Score: {$riskScore})";
        $details = json_encode([
            'transfer_data' => $transferData,
            'violations' => $violations,
            'risk_score' => $riskScore
        ]);
        
        $stmt = $this->conn->prepare("
            INSERT INTO notifications 
            (user_id, type, message, details, is_read, created_at) 
            SELECT user_id, 'fraud_alert', ?, ?, 0, NOW()
            FROM users WHERE role = 'admin'
        ");
        
        $stmt->bind_param("ss", $message, $details);
        $stmt->execute();
    }
    
    /**
     * Get fraud alerts for admin review
     */
    public function getFraudAlerts($limit = 50, $offset = 0) {
        $stmt = $this->conn->prepare("
            SELECT fa.*, 
                   p.name as player_name,
                   bc.club_name as buyer_club,
                   sc.club_name as seller_club,
                   u.name as created_by_user
            FROM fraud_alerts fa
            LEFT JOIN players p ON fa.player_id = p.player_id
            LEFT JOIN clubs bc ON fa.buyer_club_id = bc.club_id
            LEFT JOIN clubs sc ON fa.seller_club_id = sc.club_id
            LEFT JOIN users u ON fa.reviewed_by = u.user_id
            ORDER BY fa.created_at DESC
            LIMIT ? OFFSET ?
        ");
        $stmt->bind_param("ii", $limit, $offset);
        $stmt->execute();
        
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }
    
    /**
     * Review and resolve fraud alert
     */
    public function reviewFraudAlert($alertId, $reviewedBy, $action, $notes = '') {
        $stmt = $this->conn->prepare("
            UPDATE fraud_alerts 
            SET reviewed_by = ?, reviewed_at = NOW(), action_taken = ?, review_notes = ?, status = 'resolved'
            WHERE alert_id = ?
        ");
        
        $stmt->bind_param("issi", $reviewedBy, $action, $notes, $alertId);
        return $stmt->execute();
    }
    
    /**
     * Get fraud statistics
     */
    public function getFraudStatistics() {
        $stats = [];
        
        // Total alerts
        $result = $this->conn->query("SELECT COUNT(*) as total FROM fraud_alerts");
        $stats['total_alerts'] = $result->fetch_assoc()['total'];
        
        // Unresolved alerts
        $result = $this->conn->query("SELECT COUNT(*) as unresolved FROM fraud_alerts WHERE status = 'pending'");
        $stats['unresolved_alerts'] = $result->fetch_assoc()['unresolved'];
        
        // High risk alerts
        $result = $this->conn->query("SELECT COUNT(*) as high_risk FROM fraud_alerts WHERE risk_score >= 20");
        $stats['high_risk_alerts'] = $result->fetch_assoc()['high_risk'];
        
        // Alerts by type
        $result = $this->conn->query("
            SELECT JSON_UNQUOTE(JSON_EXTRACT(violations, '$[0].type')) as alert_type, 
                   COUNT(*) as count 
            FROM fraud_alerts 
            WHERE violations IS NOT NULL
            GROUP BY alert_type
        ");
        $stats['by_type'] = $result->fetch_all(MYSQLI_ASSOC);
        
        return $stats;
    }
    
    /**
     * Create fraud_alerts table if not exists
     */
    public function ensureFraudTables() {
        $createTableSQL = "
            CREATE TABLE IF NOT EXISTS fraud_alerts (
                alert_id INT AUTO_INCREMENT PRIMARY KEY,
                transfer_id INT NULL,
                player_id INT NULL,
                buyer_club_id INT NULL,
                seller_club_id INT NULL,
                risk_score INT NOT NULL DEFAULT 0,
                violations JSON NULL,
                alert_type VARCHAR(50) NOT NULL DEFAULT 'suspicious_activity',
                status ENUM('pending', 'resolved', 'false_positive') NOT NULL DEFAULT 'pending',
                reviewed_by INT NULL,
                reviewed_at DATETIME NULL,
                action_taken VARCHAR(100) NULL,
                review_notes TEXT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_risk_score (risk_score),
                INDEX idx_status (status),
                INDEX idx_created_at (created_at),
                FOREIGN KEY (transfer_id) REFERENCES transfers(transfer_id) ON DELETE SET NULL,
                FOREIGN KEY (player_id) REFERENCES players(player_id) ON DELETE SET NULL,
                FOREIGN KEY (buyer_club_id) REFERENCES clubs(club_id) ON DELETE SET NULL,
                FOREIGN KEY (seller_club_id) REFERENCES clubs(club_id) ON DELETE SET NULL,
                FOREIGN KEY (reviewed_by) REFERENCES users(user_id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
        ";
        
        if (!$this->conn->query($createTableSQL)) {
            error_log("Failed to create fraud_alerts table: " . $this->conn->error);
            return false;
        }
        
        return true;
    }
}
?>
