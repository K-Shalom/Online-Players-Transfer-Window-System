<?php
/**
 * PDF Agreement Generator for Transfer System
 * Generates professional transfer agreements in PDF format
 */

class TransferAgreementPDF {
    private $pdf;
    private $transferData;
    
    public function __construct($transferData) {
        $this->transferData = $transferData;
        $this->pdf = new FPDF();
        $this->pdf->AddPage();
        $this->setupDocument();
    }
    
    private function setupDocument() {
        // Set font
        $this->pdf->SetFont('Arial', '', 12);
        
        // Add header
        $this->pdf->SetFont('Arial', 'B', 20);
        $this->pdf->Cell(0, 15, 'TRANSFER AGREEMENT', 0, 1, 'C');
        $this->pdf->Ln(10);
        
        // Add subtitle
        $this->pdf->SetFont('Arial', 'I', 12);
        $this->pdf->Cell(0, 10, 'Official Player Transfer Contract', 0, 1, 'C');
        $this->pdf->Ln(20);
    }
    
    private function addSection($title, $content) {
        $this->pdf->SetFont('Arial', 'B', 14);
        $this->pdf->Cell(0, 10, $title, 0, 1);
        $this->pdf->SetFont('Arial', '', 11);
        $this->pdf->MultiCell(0, 8, $content);
        $this->pdf->Ln(10);
    }
    
    public function generateAgreement() {
        // Transfer Details Section
        $transferDetails = "
<strong>Transfer ID:</strong> #{$this->transferData['transfer_id']}<br>
<strong>Date:</strong> " . date('F j, Y') . "<br>
<strong>Transfer Type:</strong> " . ucfirst($this->transferData['transfer_type']) . "<br>
<strong>Transfer Fee:</strong> {$this->transferData['transfer_fee']}<br>
<strong>Contract Duration:</strong> {$this->transferData['contract_duration']} years
        ";
        $this->addSection('1. TRANSFER DETAILS', $transferDetails);
        
        // Player Information
        $playerInfo = "
<strong>Player Name:</strong> {$this->transferData['player_name']}<br>
<strong>Position:</strong> {$this->transferData['position']}<br>
<strong>Age:</strong> {$this->transferData['age']} years<br>
<strong>Nationality:</strong> {$this->transferData['nationality']}<br>
<strong>Market Value:</strong> {$this->transferData['market_value']}
        ";
        $this->addSection('2. PLAYER INFORMATION', $playerInfo);
        
        // Club Information
        $clubInfo = "
<strong>Selling Club:</strong> {$this->transferData['seller_club']}<br>
<strong>Buying Club:</strong> {$this->transferData['buyer_club']}<br>
<strong>League:</strong> {$this->transferData['league']}<br>
<strong>Season:</strong> {$this->transferData['season']}
        ";
        $this->addSection('3. CLUB INFORMATION', $clubInfo);
        
        // Contract Terms
        $contractTerms = "
<strong>Start Date:</strong> {$this->transferData['contract_start']}<br>
<strong>End Date:</strong> {$this->transferData['contract_end']}<br>
<strong>Weekly Salary:</strong> {$this->transferData['weekly_salary']}<br>
<strong>Signing Bonus:</strong> {$this->transferData['signing_bonus']}<br>
<strong>Performance Bonuses:</strong> {$this->transferData['performance_bonuses']}
        ";
        $this->addSection('4. CONTRACT TERMS', $contractTerms);
        
        // Legal Terms
        $legalTerms = "
This agreement is made between the selling club and buying club for the permanent transfer of the player mentioned above. 
Both parties agree to the terms and conditions outlined in this document. The transfer is subject to the player passing 
medical examination and agreeing to personal terms with the buying club.

The transfer fee shall be paid according to the payment schedule agreed upon by both clubs. The player is obligated to 
remain with the buying club for the duration specified in this contract unless both parties agree to a subsequent transfer.

This agreement is governed by the laws of the football association and all disputes shall be resolved through the 
appropriate channels.
        ";
        $this->addSection('5. LEGAL TERMS & CONDITIONS', $legalTerms);
        
        // Signatures Section
        $this->pdf->Ln(20);
        $this->pdf->SetFont('Arial', 'B', 12);
        $this->pdf->Cell(0, 10, 'SIGNATURES', 0, 1, 'C');
        $this->pdf->Ln(20);
        
        // Seller Signature
        $this->pdf->Cell(80, 30, '', 1, 0);
        $this->pdf->Cell(40, 30, '', 0, 0);
        $this->pdf->Cell(80, 30, '', 1, 1);
        
        $this->pdf->SetFont('Arial', '', 10);
        $this->pdf->Cell(80, 8, 'Selling Club Representative', 0, 0, 'C');
        $this->pdf->Cell(40, 8, '', 0, 0);
        $this->pdf->Cell(80, 8, 'Buying Club Representative', 0, 1, 'C');
        
        $this->pdf->Cell(80, 8, 'Name: _________________', 0, 0, 'C');
        $this->pdf->Cell(40, 8, '', 0, 0);
        $this->pdf->Cell(80, 8, 'Name: _________________', 0, 1, 'C');
        
        $this->pdf->Cell(80, 8, 'Date: _________________', 0, 0, 'C');
        $this->pdf->Cell(40, 8, '', 0, 0);
        $this->pdf->Cell(80, 8, 'Date: _________________', 0, 1, 'C');
        
        return $this->pdf;
    }
    
    public function savePDF($filename) {
        return $this->pdf->Output('F', $filename);
    }
    
    public function getPDFContent() {
        return $this->pdf->Output('S');
    }
}

// Alternative implementation using TCPDF (if available)
class TransferAgreementTCPDF {
    private $pdf;
    private $transferData;
    
    public function __construct($transferData) {
        $this->transferData = $transferData;
        $this->pdf = new TCPDF(PDF_PAGE_ORIENTATION, PDF_UNIT, PDF_PAGE_FORMAT, true, 'UTF-8', false);
        $this->setupDocument();
    }
    
    private function setupDocument() {
        // Set document information
        $this->pdf->SetCreator('OPTW System');
        $this->pdf->SetAuthor('Online Players Transfer Window System');
        $this->pdf->SetTitle('Transfer Agreement #' . $this->transferData['transfer_id']);
        
        // Set header and footer
        $this->pdf->setHeaderData('', 0, 'TRANSFER AGREEMENT', 'Official Player Transfer Contract');
        $this->pdf->setFooterData(array(0,64,0), array(0,64,0));
        
        // Set margins
        $this->pdf->SetMargins(PDF_MARGIN_LEFT, PDF_MARGIN_TOP, PDF_MARGIN_RIGHT);
        $this->pdf->SetHeaderMargin(PDF_MARGIN_HEADER);
        $this->pdf->SetFooterMargin(PDF_MARGIN_FOOTER);
        
        // Set auto page breaks
        $this->pdf->SetAutoPageBreak(TRUE, PDF_MARGIN_BOTTOM);
        
        // Add page
        $this->pdf->AddPage();
    }
    
    public function generateAgreement() {
        $html = $this->generateHTMLContent();
        $this->pdf->writeHTML($html, true, false, true, false, '');
        return $this->pdf;
    }
    
    private function generateHTMLContent() {
        return "
        <h1>TRANSFER AGREEMENT</h1>
        <h2>Official Player Transfer Contract</h2>
        
        <h3>1. TRANSFER DETAILS</h3>
        <p><strong>Transfer ID:</strong> #{$this->transferData['transfer_id']}<br>
        <strong>Date:</strong> " . date('F j, Y') . "<br>
        <strong>Transfer Type:</strong> " . ucfirst($this->transferData['transfer_type']) . "<br>
        <strong>Transfer Fee:</strong> {$this->transferData['transfer_fee']}<br>
        <strong>Contract Duration:</strong> {$this->transferData['contract_duration']} years</p>
        
        <h3>2. PLAYER INFORMATION</h3>
        <p><strong>Player Name:</strong> {$this->transferData['player_name']}<br>
        <strong>Position:</strong> {$this->transferData['position']}<br>
        <strong>Age:</strong> {$this->transferData['age']} years<br>
        <strong>Nationality:</strong> {$this->transferData['nationality']}</p>
        
        <h3>3. CLUB INFORMATION</h3>
        <p><strong>Selling Club:</strong> {$this->transferData['seller_club']}<br>
        <strong>Buying Club:</strong> {$this->transferData['buyer_club']}</p>
        
        <h3>4. CONTRACT TERMS</h3>
        <p><strong>Start Date:</strong> {$this->transferData['contract_start']}<br>
        <strong>End Date:</strong> {$this->transferData['contract_end']}</p>
        
        <h3>5. LEGAL TERMS & CONDITIONS</h3>
        <p>This agreement is made between the selling club and buying club for the permanent transfer of the player mentioned above. Both parties agree to the terms and conditions outlined in this document.</p>
        ";
    }
    
    public function savePDF($filename) {
        return $this->pdf->Output($filename, 'F');
    }
    
    public function getPDFContent() {
        return $this->pdf->Output('', 'S');
    }
}

// Helper function to generate PDF
function generateTransferAgreement($transferData, $useTCPDF = false) {
    try {
        if ($useTCPDF && class_exists('TCPDF')) {
            $generator = new TransferAgreementTCPDF($transferData);
        } else {
            // FPDF is simpler and more commonly available
            require_once 'fpdf.php';
            $generator = new TransferAgreementPDF($transferData);
        }
        
        $generator->generateAgreement();
        return $generator;
    } catch (Exception $e) {
        error_log('PDF Generation Error: ' . $e->getMessage());
        return false;
    }
}
?>
