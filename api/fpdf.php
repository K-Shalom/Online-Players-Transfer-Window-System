<?php
/**
 * Simple FPDF implementation for PDF generation
 * Basic FPDF class for creating PDF documents
 */
class FPDF {
    protected $page;               // Current page number
    protected $n;                  // Current object number
    protected $offsets;            // Array of object offsets
    protected $buffer;             // Buffer holding in-memory PDF
    protected $pages;              // Array containing pages
    protected $state;              // Current document state
    protected $compress;           // Compression flag
    protected $def_orientation;    // Default orientation
    protected $cur_orientation;    // Current orientation
    protected $page_sizes;        // Array with page sizes
    protected $def_page_size;     // Default page size
    protected $cur_page_size;     // Current page size
    protected $w_pt, $h_pt;        // Dimensions of current page in points
    protected $w, $h;              // Dimensions of current page in user unit
    protected $l_margin;           // Left margin
    protected $t_margin;           // Top margin
    protected $r_margin;           // Right margin
    protected $b_margin;           // Page break margin
    protected $c_margin;           // Internal cell margin
    protected $x, $y;              // Current position in user unit
    protected $lasth;              // Height of last printed cell
    protected $line_width;         // Line width in user unit
    protected $font_family;        // Current font family
    protected $font_style;         // Current font style
    protected $font_size;          // Current font size
    protected $fonts;              // Array of used fonts
    protected $font_files;         // Array of font files
    protected $draw_color;         // Draw color
    protected $fill_color;         // Fill color
    protected $text_color;         // Text color
    protected $color_flag;         // Indicates whether fill and text colors are different
    protected $ws;                 // Word spacing
    protected $images;             // Array of used images
    protected $page_links;         // Array of links in pages
    protected $links;              // Array of internal links
    protected $auto_page_break;    // Automatic page breaking
    protected $page_break_trigger;  // Threshold used to trigger page breaks
    protected $current_font;        // Current font info
    protected $current_font_style;  // Current font style
    protected $current_font_size;  // Current font size
    protected $core_fonts;        // Array of core font names

    const PDF_VERSION = '1.3';
    const PDF_MARGIN_LEFT = 10;
    const PDF_MARGIN_TOP = 10;
    const PDF_MARGIN_RIGHT = 10;
    const PDF_MARGIN_BOTTOM = 10;
    const PDF_MARGIN_HEADER = 5;
    const PDF_MARGIN_FOOTER = 10;
    const PDF_PAGE_ORIENTATION = 'P';
    const PDF_UNIT = 'mm';
    const PDF_PAGE_FORMAT = 'A4';

    public function __construct($orientation = 'P', $unit = 'mm', $size = 'A4') {
        // Set some internal properties
        $this->page = 0;
        $this->n = 2;
        $this->offsets = array();
        $this->buffer = '';
        $this->pages = array();
        $this->state = 0;
        $this->compress = false;
        $this->def_orientation = $orientation;
        $this->cur_orientation = $orientation;
        $this->page_sizes = array();
        $this->def_page_size = $this->_getpagesize($size);
        $this->cur_page_size = $this->def_page_size;
        $this->page_sizes[$orientation] = &$this->cur_page_size;
        
        // Check page size and orientation
        if($orientation == 'P') {
            $this->w_pt = $this->def_page_size['w'];
            $this->h_pt = $this->def_page_size['h'];
        } else {
            $this->w_pt = $this->def_page_size['h'];
            $this->h_pt = $this->def_page_size['w'];
        }
        
        $this->w = $this->w_pt / $this->k;
        $this->h = $this->h_pt / $this->k;
        
        // Set margins
        $this->l_margin = 10;
        $this->t_margin = 10;
        $this->r_margin = 10;
        $this->b_margin = 20;
        $this->c_margin = 1;
        
        // Set internal line width
        $this->line_width = .567 / $this->k;
        
        // Set font
        $this->SetFont('Arial', '', 12);
        
        // Set colors
        $this->SetDrawColor(0, 0, 0);
        $this->SetFillColor(255, 255, 255);
        $this->SetTextColor(0, 0, 0);
        
        // These properties are not used
        $this->color_flag = false;
        $this->ws = 0;
        
        // Standard fonts
        $this->core_fonts = array('courier', 'helvetica', 'arial', 'times', 'symbol', 'zapfdingbats');
        
        // Scale factor
        $this->k = 72 / 25.4;
        
        // Auto page break
        $this->auto_page_break = true;
        $this->page_break_trigger = 5;
        
        // Core fonts
        $this->fonts = array();
        $this->font_files = array();
        $this->images = array();
        $this->page_links = array();
        $this->links = array();
        
        // Initialize font
        $this->current_font = null;
        $this->current_font_style = '';
        $this->current_font_size = 0;
    }

    public function AddPage($orientation = '', $size = '') {
        // Start a new page
        if($this->state == 0)
            $this->Open();
        $family = $this->font_family;
        $style = $this->font_style;
        $size = $this->font_size;
        $lw = $this->line_width;
        $dc = $this->draw_color;
        $fc = $this->fill_color;
        $tc = $this->text_color;
        $cf = $this->color_flag;
        if($orientation == '')
            $orientation = $this->def_orientation;
        else
            $this->def_orientation = $orientation;
        if($size == '')
            $size = $this->def_page_size;
        else
            $this->def_page_size = $size;
        if($orientation != $this->cur_orientation || $size != $this->cur_page_size) {
            // New size or orientation
            if($orientation == 'P') {
                $this->w_pt = $size['w'];
                $this->h_pt = $size['h'];
            } else {
                $this->w_pt = $size['h'];
                $this->h_pt = $size['w'];
            }
            $this->w = $this->w_pt / $this->k;
            $this->h = $this->h_pt / $this->k;
            $this->page_break_trigger = $this->h - $this->b_margin;
            $this->cur_orientation = $orientation;
            $this->cur_page_size = $size;
        }
        if($orientation != $this->cur_orientation || $size != $this->cur_page_size) {
            $this->page_sizes[$orientation] = &$this->cur_page_size;
        }
        // Start page
        $this->page++;
        $this->pages[$this->page] = '';
        $this->state = 2;
        $this->x = $this->l_margin;
        $this->y = $this->t_margin;
        $this->font_family = $family;
        $this->font_style = $style;
        $this->font_size = $size;
        $this->line_width = $lw;
        $this->draw_color = $dc;
        $this->fill_color = $fc;
        $this->text_color = $tc;
        $this->color_flag = $cf;
        $this->SetFont($family, $style, $size);
    }

    public function SetFont($family, $style = '', $size = 0) {
        // Select a font; size given in points
        if($size == 0)
            $size = $this->font_size;
        $family = strtolower($family);
        if($family == 'arial')
            $family = 'helvetica';
        elseif($family == 'symbol' || $family == 'zapfdingbats')
            $style = '';
        $style = strtoupper($style);
        if(strpos($style, 'U') !== false) {
            $this->underline = true;
            $style = str_replace('U', '', $style);
        } else
            $this->underline = false;
        if($style == 'IB')
            $style = 'BI';
        if($size == 0)
            $size = $this->font_size;
        // Test if font is already selected
        if($this->font_family == $family && $this->font_style == $style && $this->font_size == $size)
            return;
        // Test if used for the first time
        $fontkey = $family.$style;
        if(!isset($this->fonts[$fontkey])) {
            // Check if one of the core fonts
            if(in_array($family, $this->core_fonts)) {
                if($family == 'symbol' || $family == 'zapfdingbats')
                    $this->fonts[$fontkey] = array('i' => $family, 'type' => 'core', 'name' => $this->core_fonts[$family], 'desc' => $this->core_fonts[$family], 'up' => -100, 'ut' => 50, 'cw' => $this->core_fonts[$family]);
                else {
                    $name = $this->core_fonts[$family];
                    $cw = $this->core_fonts[$family];
                    $this->fonts[$fontkey] = array('i' => $family, 'type' => 'core', 'name' => $name, 'desc' => $name, 'up' => -100, 'ut' => 50, 'cw' => $cw);
                }
            } else {
                // Add other fonts here if needed
            }
        }
        // Select it
        $this->font_family = $family;
        $this->font_style = $style;
        $this->font_size = $size;
        $this->current_font = $fontkey;
        $this->current_font_style = $style;
        $this->current_font_size = $size;
        
        if($this->page > 0)
            $this->_out(sprintf('BT /F%d %.2F Tf ET', $this->fonts[$fontkey]['i'], $size));
    }

    public function SetFontSize($size) {
        // Set font size in points
        if($this->font_size == $size)
            return;
        $this->font_size = $size;
        $this->current_font_size = $size;
        if($this->page > 0)
            $this->_out(sprintf('BT /F%d %.2F Tf ET', $this->fonts[$this->current_font]['i'], $size));
    }

    public function AddLink() {
        // Create a new internal link
        $n = count($this->links) + 1;
        $this->links[$n] = array(0, 0);
        return $n;
    }

    public function SetLink($link, $y = 0, $page = -1) {
        // Set destination of internal link
        if($y == -1)
            $y = $this->y;
        if($page == -1)
            $page = $this->page;
        $this->links[$link] = array($page, $y);
    }

    public function SetTextColor($r, $g = -1, $b = -1) {
        // Set color for text
        if(($r == 0 && $g == 0 && $b == 0) || $g == -1)
            $this->text_color = sprintf('%.3F', $r/255);
        else
            $this->text_color = sprintf('%.3F %.3F %.3F', $r/255, $g/255, $b/255);
        $this->color_flag = ($this->fill_color != $this->text_color);
    }

    public function SetFillColor($r, $g = -1, $b = -1) {
        // Set color for filling
        if(($r == 0 && $g == 0 && $b == 0) || $g == -1)
            $this->fill_color = sprintf('%.3F', $r/255);
        else
            $this->fill_color = sprintf('%.3F %.3F %.3F', $r/255, $g/255, $b/255);
        $this->color_flag = ($this->fill_color != $this->text_color);
    }

    public function SetDrawColor($r, $g = -1, $b = -1) {
        // Set color for drawing
        if(($r == 0 && $g == 0 && $b == 0) || $g == -1)
            $this->draw_color = sprintf('%.3F', $r/255);
        else
            $this->draw_color = sprintf('%.3F %.3F %.3F', $r/255, $g/255, $b/255);
    }

    public function GetStringWidth($s) {
        // Get width of a string in the current font
        $s = (string)$s;
        $cw = &$this->fonts[$this->current_font]['cw'];
        $w = 0;
        $l = strlen($s);
        for($i = 0; $i < $l; $i++)
            $w += $cw[$s[$i]];
        return $w * $this->font_size / 1000;
    }

    public function SetLineWidth($width) {
        // Set line width
        $this->line_width = $width;
        if($this->page > 0)
            $this->_out(sprintf('%.2F w', $width * $this->k));
    }

    public function Line($x1, $y1, $x2, $y2) {
        // Draw a line
        $this->_out(sprintf('%.2F %.2F m %.2F %.2F l S', $x1 * $this->k, ($this->h - $y1) * $this->k, $x2 * $this->k, ($this->h - $y2) * $this->k));
    }

    public function Rect($x, $y, $w, $h, $style = '') {
        // Draw a rectangle
        if($style == 'F')
            $op = 'f';
        elseif($style == 'FD' || $style == 'DF')
            $op = 'B';
        else
            $op = 'S';
        $this->_out(sprintf('%.2F %.2F %.2F %.2F re %s', $x * $this->k, ($this->h - $y) * $this->k, $w * $this->k, -$h * $this->k, $op));
    }

    public function AddFont($family, $style = '', $file = '') {
        // Add a TrueType or Type1 font
        $family = strtolower($family);
        if($file == '')
            $file = str_replace(' ', '', $family) . strtolower($style) . '.php';
        $style = strtoupper($style);
        if($style == 'IB')
            $style = 'BI';
        $fontkey = $family.$style;
        if(isset($this->fonts[$fontkey]))
            return;
        
        include($file);
        if(!isset($name))
            $this->Error('Could not add font: ' . $file);
        
        $this->fonts[$fontkey] = array(
            'type' => 'TrueType',
            'name' => $name,
            'desc' => $desc,
            'up' => $up,
            'ut' => $ut,
            'cw' => $cw,
            'file' => $file,
            'i' => count($this->fonts) + 1
        );
    }

    public function SetFont($family, $style = '', $size = 0) {
        // Select a font; size given in points
        if($size == 0)
            $size = $this->font_size;
        $family = strtolower($family);
        if($family == 'arial')
            $family = 'helvetica';
        elseif($family == 'symbol' || $family == 'zapfdingbats')
            $style = '';
        $style = strtoupper($style);
        if(strpos($style, 'U') !== false) {
            $this->underline = true;
            $style = str_replace('U', '', $style);
        } else
            $this->underline = false;
        if($style == 'IB')
            $style = 'BI';
        if($size == 0)
            $size = $this->font_size;
        // Test if font is already selected
        if($this->font_family == $family && $this->font_style == $style && $this->font_size == $size)
            return;
        // Test if used for the first time
        $fontkey = $family.$style;
        if(!isset($this->fonts[$fontkey])) {
            // Check if one of the core fonts
            if(in_array($family, $this->core_fonts)) {
                $name = $this->core_fonts[$family];
                $cw = $this->core_fonts[$family];
                $this->fonts[$fontkey] = array('i' => $family, 'type' => 'core', 'name' => $name, 'desc' => $name, 'up' => -100, 'ut' => 50, 'cw' => $cw);
            } else {
                // Add other fonts here if needed
            }
        }
        // Select it
        $this->font_family = $family;
        $this->font_style = $style;
        $this->font_size = $size;
        $this->current_font = $fontkey;
        $this->current_font_style = $style;
        $this->current_font_size = $size;
        
        if($this->page > 0)
            $this->_out(sprintf('BT /F%d %.2F Tf ET', $this->fonts[$fontkey]['i'], $size));
    }

    public function Cell($w, $h = 0, $txt = '', $border = 0, $ln = 0, $align = '', $fill = false, $link = '') {
        // Output a cell
        $k = $this->k;
        if($this->font_family == 'arial')
            $family = 'helvetica';
        else
            $family = $this->font_family;
        if($this->font_style == 'I')
            $style = 'I';
        elseif($this->font_style == 'B')
            $style = 'B';
        elseif($this->font_style == 'BI')
            $style = 'BI';
        else
            $style = '';
        $size = $this->font_size;
        
        if($w == 0)
            $w = $this->w - $this->r_margin - $this->x;
        
        if($h == 0)
            $h = $this->font_size * 0.35;
        
        // Simple cell implementation
        $x = $this->x;
        $y = $this->y;
        
        if($fill || $border == 1) {
            if($fill)
                $op = ($border == 1) ? 'B' : 'f';
            else
                $op = 'S';
            $this->_out(sprintf('%.2F %.2F %.2F %.2F re %s', $x * $k, ($this->h - $y) * $k, $w * $k, -$h * $k, $op));
        }
        
        if(is_string($border)) {
            $x = $this->x;
            $y = $this->y;
            if(strpos($border, 'L') !== false)
                $this->Line($x, $y, $x, $y + $h);
            if(strpos($border, 'T') !== false)
                $this->Line($x, $y, $x + $w, $y);
            if(strpos($border, 'R') !== false)
                $this->Line($x + $w, $y, $x + $w, $y + $h);
            if(strpos($border, 'B') !== false)
                $this->Line($x, $y + $h, $x + $w, $y + $h);
        }
        
        if($txt !== '') {
            // Simple text output
            $txt = str_replace(')', '\\)', str_replace('(', '\\(', str_replace('\\', '\\\\', $txt)));
            if($align == 'R')
                $dx = $w - $this->GetStringWidth($txt) - 0.5;
            elseif($align == 'C')
                $dx = ($w - $this->GetStringWidth($txt)) / 2;
            else
                $dx = 1.5;
            
            if($this->color_flag)
                $s = sprintf('q %s %.2F %.2F %.2F rg %.2F %.2F Td (%s) Tj Q', $this->text_color, $x + $dx, ($this->h - ($y + 0.5 * $h + 0.3 * $this->font_size)) * $k, $size * $k, $txt);
            else
                $s = sprintf('BT %.2F %.2F Td (%s) Tj ET', ($x + $dx) * $k, ($this->h - ($y + 0.5 * $h + 0.3 * $this->font_size)) * $k, $txt);
            
            $this->_out($s);
        }
        
        $this->lasth = $h;
        if($ln > 0) {
            // Go to the beginning of the next line
            $this->y += $h;
            if($ln == 1)
                $this->x = $this->l_margin;
            else
                $this->x += $w;
        } else {
            $this->x += $w;
        }
    }

    public function MultiCell($w, $h, $txt, $border = 0, $align = 'J', $fill = false) {
        // Output text with automatic or explicit line breaks
        $cw = &$this->fonts[$this->current_font]['cw'];
        if($w == 0)
            $w = $this->w - $this->l_margin - $this->r_margin;
        $wmax = ($w - 2 * $this->c_margin) * 1000 / $this->font_size;
        $s = str_replace("\r", '', $txt);
        $nb = strlen($s);
        if($nb > 0 && $s[$nb - 1] == "\n")
            $nb--;
        $sep = -1;
        $i = 0;
        $j = 0;
        $l = 0;
        $nl = 1;
        while($i < $nb) {
            // Get next character
            $c = $s[$i];
            if($c == "\n") {
                // Explicit line break
                if($this->ws > 0) {
                    $this->ws = 0;
                    $this->_out('0 Tw');
                }
                $this->Cell($w, $h, substr($s, $j, $i - $j), $border, 2, $align, $fill);
                $i++;
                $sep = -1;
                $j = $i;
                $l = 0;
                $nl++;
                if($border && $nl == 2)
                    $border = 'LR';
                continue;
            }
            if($c == ' ') {
                $sep = $i;
                $ls = $l;
            }
            $l += $cw[$c];
            if($l > $wmax) {
                // Automatic line break
                if($sep == -1) {
                    if($i == $j) {
                        $i++;
                    }
                    if($this->ws > 0) {
                        $this->ws = 0;
                        $this->_out('0 Tw');
                    }
                    $this->Cell($w, $h, substr($s, $j, $i - $j), $border, 2, $align, $fill);
                } else {
                    if($align == 'J') {
                        $this->ws = ($wmax - $ls) / 1000 * $this->font_size;
                        $this->_out(sprintf('%.3F Tw', $this->ws));
                    }
                    $this->Cell($w, $h, substr($s, $j, $sep - $j), $border, 2, $align, $fill);
                    $i = $sep + 1;
                }
                $sep = -1;
                $j = $i;
                $l = 0;
                $nl++;
                if($border && $nl == 2)
                    $border = 'LR';
            } else
                $i++;
        }
        // Last chunk
        if($this->ws > 0) {
            $this->ws = 0;
            $this->_out('0 Tw');
        }
        if($border && strpos($border, 'B') !== false)
            $border = 'LR';
        else
            $border = '';
        $this->Cell($w, $h, substr($s, $j, $i - $j), $border, 2, $align, $fill);
        $this->x = $this->l_margin;
    }

    public function Ln($h = null) {
        // Line feed; default height is last cell height
        $this->x = $this->l_margin;
        if($h === null)
            $this->y += $this->lasth;
        else
            $this->y += $h;
    }

    public function Output($dest = '', $name = '', $isUTF8 = false) {
        // Output PDF to some destination
        if($this->state < 3)
            $this->Close();
        
        if($dest == '') {
            $dest = 'I';
        }
        
        if($dest == 'I') {
            // Send to browser
            header('Content-Type: application/pdf');
            header('Content-Disposition: inline; filename="' . $name . '"');
            header('Cache-Control: private, max-age=0, must-revalidate');
            header('Pragma: public');
            echo $this->buffer;
            return '';
        } elseif($dest == 'D') {
            // Download file
            header('Content-Type: application/x-download');
            header('Content-Disposition: attachment; filename="' . $name . '"');
            header('Cache-Control: private, max-age=0, must-revalidate');
            header('Pragma: public');
            echo $this->buffer;
            return '';
        } elseif($dest == 'F') {
            // Save to local file
            $f = fopen($name, 'wb');
            if(!$f)
                $this->Error('Unable to create output file: ' . $name);
            fwrite($f, $this->buffer);
            fclose($f);
            return '';
        } elseif($dest == 'S') {
            // Return as a string
            return $this->buffer;
        } else {
            $this->Error('Incorrect output destination: ' . $dest);
        }
        return '';
    }

    protected function _getpagesize($size) {
        // Get page dimensions from size string
        if(is_string($size)) {
            $size = strtolower($size);
            if($size == 'a3')
                return array(841.89, 1190.55);
            elseif($size == 'a4')
                return array(595.28, 841.89);
            elseif($size == 'a5')
                return array(420.94, 595.28);
            elseif($size == 'letter')
                return array(612, 792);
            elseif($size == 'legal')
                return array(612, 1008);
            else
                $this->Error('Unknown page size: ' . $size);
        } else {
            if($size[0] > $size[1])
                return array($size[1], $size[0]);
            else
                return $size;
        }
    }

    protected function _beginpage($orientation, $size) {
        $this->page++;
        $this->pages[$this->page] = '';
        $this->state = 2;
        $this->x = $this->l_margin;
        $this->y = $this->t_margin;
        $this->font_family = '';
    }

    protected function _endpage() {
        $this->state = 1;
    }

    protected function _loadfont($font) {
        // Load a font definition file
        include($font);
        $a = get_defined_vars();
        if(!isset($a['name']))
            $this->Error('Could not load font: ' . $font);
    }

    protected function _escape($s) {
        // Escape special characters in strings
        $s = str_replace('\\', '\\\\', $s);
        $s = str_replace('(', '\\(', $s);
        $s = str_replace(')', '\\)', $s);
        $s = str_replace("\r", '\\r', $s);
        return $s;
    }

    protected function _putstream($s) {
        $this->_out('stream');
        $this->_out($s);
        $this->_out('endstream');
    }

    protected function _out($s) {
        // Add a line to the document
        if($this->state == 2)
            $this->pages[$this->page] .= $s . "\n";
        else
            $this->buffer .= $s . "\n";
    }

    protected function _putpages() {
        $nb = $this->page;
        for($n = 1; $n <= $nb; $n++) {
            $this->page = $n;
            $this->_out('/Parent 1 0 R');
            $this->_out(sprintf('/MediaBox [0 0 %.2F %.2F]', $this->w_pt, $this->h_pt));
            $this->_out('/Resources 2 0 R');
            $this->_out('/Contents ' . (3 + 2 * $n) . ' 0 R>>');
            $this->_out('endobj');
            $this->_putstreamobject($this->pages[$n]);
        }
        $this->_newobj(2);
        $this->_out('<</ProcSet [/PDF /Text /ImageB /ImageC /ImageI]');
        $this->_out('/Font <<');
        foreach($this->fonts as $font) {
            $this->_out('/F' . $font['i'] . ' ' . $font['n'] . ' 0 R');
        }
        $this->_out('>>');
        $this->_out('>>');
        $this->_out('endobj');
    }

    protected function _putfonts() {
        $nf = $this->n;
        foreach($this->fonts as $k => $font) {
            // Font objects
            $this->fonts[$k]['n'] = $this->n + 1;
            $type = $font['type'];
            $name = $font['name'];
            if($type == 'core') {
                // Standard font
                $this->_newobj();
                $this->_out('<</Type /Font');
                $this->_out('/Subtype /Type1');
                $this->_out('/Name /F' . $font['i']);
                $this->_out('/BaseFont /' . $name);
                $this->_out('>>');
                $this->_out('endobj');
            } elseif($type == 'Type1' || $type == 'TrueType') {
                // Additional Type1 or TrueType font
                $this->_newobj();
                $this->_out('<</Type /Font');
                $this->_out('/Subtype /' . $type);
                $this->_out('/Name /F' . $font['i']);
                $this->_out('/BaseFont /' . $name);
                $this->_out('/FirstChar 32');
                $this->_out('/LastChar 255');
                $this->_out('/Widths ' . ($this->n + 1) . ' 0 R');
                $this->_out('/FontDescriptor ' . ($this->n + 2) . ' 0 R');
                $this->_out('>>');
                $this->_out('endobj');
                
                // Widths
                $this->_newobj();
                $cw = &$font['cw'];
                $s = '[';
                for($i = 32; $i <= 255; $i++) {
                    $s .= $cw[chr($i)] . ' ';
                }
                $this->_out($s . ']');
                $this->_out('endobj');
                
                // Descriptor
                $this->_newobj();
                $s = '<</Type /FontDescriptor /FontName /' . $name;
                foreach($font['desc'] as $k => $v) {
                    $s .= ' /' . $k . ' ' . $v;
                }
                $s .= '>>';
                $this->_out($s);
                $this->_out('endobj');
            } else {
                // Allow for additional types
                $mtd = '_put' . strtolower($type);
                if(!method_exists($this, $mtd))
                    $this->Error('Unsupported font type: ' . $type);
                $this->$mtd($font);
            }
        }
    }

    protected function _newobj($n = null) {
        // Begin a new object
        if($n === null)
            $n = ++$this->n;
        $this->offsets[$n] = strlen($this->buffer);
        $this->_out($n . ' 0 obj');
    }

    protected function _putstreamobject($s) {
        $this->_newobj();
        $this->_out('<<');
        $this->_out('/Length ' . strlen($s));
        $this->_out('>>');
        $this->_out('stream');
        $this->_out($s);
        $this->_out('endstream');
        $this->_out('endobj');
    }

    public function Open() {
        // Begin document
        $this->state = 1;
    }

    public function Close() {
        // Terminate document
        if($this->state == 3)
            return;
        if($this->page == 0)
            $this->AddPage();
        
        // Page footer
        $this->state = 0;
        
        // Add core fonts if needed
        foreach($this->core_fonts as $font) {
            if(!isset($this->fonts[$font])) {
                $this->AddFont($font);
            }
        }
        
        // Save document
        $this->_newobj();
        $this->_out('<</Type /Catalog');
        $this->_out('/Pages 1 0 R');
        $this->_out('/OpenAction [3 0 R /FitH null]');
        $this->_out('/PageLayout /OneColumn');
        $this->_out('>>');
        $this->_out('endobj');
        
        $this->_newobj();
        $this->_out('<</Type /Pages');
        $kids = '/Kids [';
        for($i = 1; $i <= $this->page; $i++) {
            $kids .= (3 + 2 * $i) . ' 0 R ';
        }
        $this->_out($kids . ']');
        $this->_out('/Count ' . $this->page);
        $this->_out(sprintf('/MediaBox [0 0 %.2F %.2F]', $this->def_page_size['w'], $this->def_page_size['h']));
        $this->_out('>>');
        $this->_out('endobj');
        
        $this->_putpages();
        $this->_putfonts();
        
        $this->_newobj(1);
        $this->_out('<<');
        $this->_out('/Producer ' . $this->_textstring('FPDF'));
        $this->_out('/CreationDate ' . $this->_textstring('D:' . date('YmdHis')));
        $this->_out('/ModDate ' . $this->_textstring('D:' . date('YmdHis')));
        $this->_out('>>');
        $this->_out('endobj');
        
        $this->_newobj(0);
        $this->_out('<<');
        $this->_out('/Type /Pages');
        $this->_out('/Count ' . $this->page);
        $kids = '/Kids [';
        for($i = 1; $i <= $this->page; $i++) {
            $kids .= (3 + 2 * $i) . ' 0 R ';
        }
        $this->_out($kids . ']');
        $this->_out('>>');
        $this->_out('endobj');
        
        $o = strlen($this->buffer);
        $this->_putxref($o);
        $this->_out('trailer');
        $this->_out('<<');
        $this->_out('/Size ' . ($this->n + 1));
        $this->_out('/Root 1 0 R');
        $this->_out('/Info 0 0 R');
        $this->_out('>>');
        $this->_out('startxref');
        $this->_out($o);
        $this->_out('%%EOF');
        $this->state = 3;
    }

    protected function _putxref($offset) {
        $this->_out('xref');
        $this->_out('0 ' . ($this->n + 1));
        $this->_out('0000000000 65535 f ');
        for($i = 1; $i <= $this->n; $i++) {
            $this->_out(sprintf('%010d 00000 n ', $this->offsets[$i]));
        }
    }

    protected function _textstring($s) {
        // Format a text string
        return '(' . $this->_escape($s) . ')';
    }

    public function Error($msg) {
        // Fatal error
        throw new Exception('FPDF error: ' . $msg);
    }
}
?>
