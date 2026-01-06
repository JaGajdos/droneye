<?php
/**
 * Contentful Synchronization Script (GraphQL API)
 * 
 * This script synchronizes YouTube videos and photos from Contentful CMS
 * using GraphQL API and saves them to JSON files in assets/contentful/ directory.
 * 
 * Usage: 
 *   CLI: php sync-contentful.php
 *   Web: Include this file from sync-contentful-web.php
 * 
 * Returns: array with success status and data (when called from web)
 */

// Check if running from CLI or web
$isWebRequest = php_sapi_name() !== 'cli';

// If running from web, capture output
if ($isWebRequest) {
    ob_start();
}

// Contentful API credentials
$SPACE_ID = 'iiv5boddr0f6';
$ACCESS_TOKEN = 'E9j1RKoVUZIyRGNiTkGb9hkfBSPei8_rH6OARmyyxJ8';
$ENVIRONMENT = 'master'; // or 'staging' if using different environment

// GraphQL endpoint
$GRAPHQL_ENDPOINT = "https://graphql.contentful.com/content/v1/spaces/{$SPACE_ID}/environments/{$ENVIRONMENT}";

// Output directory for synchronized content
// Use DIRECTORY_SEPARATOR for cross-platform compatibility (Windows/Linux/Mac)
$OUTPUT_DIR = __DIR__ . DIRECTORY_SEPARATOR . 'assets' . DIRECTORY_SEPARATOR . 'contentful';
$IMAGES_DIR = $OUTPUT_DIR . DIRECTORY_SEPARATOR . 'images';
$YOUTUBE_OUTPUT_FILE = $OUTPUT_DIR . DIRECTORY_SEPARATOR . 'youtube-videos.json';
$PHOTOS_OUTPUT_FILE = $OUTPUT_DIR . DIRECTORY_SEPARATOR . 'photos.json';

try {
    echo "🔄 Starting Contentful synchronization (GraphQL)...\n";
    echo "Space ID: {$SPACE_ID}\n";
    echo "Environment: {$ENVIRONMENT}\n\n";
    
    // Create output directory if it doesn't exist
    if (!is_dir($OUTPUT_DIR)) {
        mkdir($OUTPUT_DIR, 0755, true);
        echo "✅ Created directory: {$OUTPUT_DIR}\n";
    }
    
    // GraphQL query to fetch YouTube videos and photos
    $graphqlQuery = '
    {
      youtubeVideoCollection {
        items {
          sys {
            id
          }
          videoId
          videoNadpisSk
          videoNadpisEn
          videoNadpisDe
        }
      }
      fotografiaCollection {
        items {
          sys {
            id
          }
          fotografiaNadpisSk
          fotografiaNadpisEn
          fotografiaNadpisDe
          fotkyCollection {
            items {
              fileName
              contentType
              url
            }
          }
        }
      }
    }
    ';
    
    // Make GraphQL request
    $ch = curl_init($GRAPHQL_ENDPOINT);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['query' => $graphqlQuery]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $ACCESS_TOKEN
    ]);
    
    echo "📡 Fetching data from Contentful GraphQL API...\n";
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200) {
        throw new Exception("GraphQL request failed with HTTP code: {$httpCode}. Response: {$response}");
    }
    
    $data = json_decode($response, true);
    
    if (isset($data['errors'])) {
        throw new Exception("GraphQL errors: " . json_encode($data['errors']));
    }
    
    if (!isset($data['data'])) {
        throw new Exception("Invalid response structure. Response: " . $response);
    }
    
    // Process YouTube videos
    echo "\n📹 Processing YouTube videos...\n";
    $videos = [];
    $videoItems = $data['data']['youtubeVideoCollection']['items'] ?? [];
    
    foreach ($videoItems as $index => $item) {
        $videoId = $item['videoId'] ?? null;
        
        if ($videoId) {
            $video = [
                'id' => $videoId,
                'title' => [
                    'sk' => $item['videoNadpisSk'] ?? null,
                    'en' => $item['videoNadpisEn'] ?? null,
                    'de' => $item['videoNadpisDe'] ?? null
                ],
                'order' => $index + 1
            ];
            
            $videos[] = $video;
            $titleSk = $item['videoNadpisSk'] ?? 'No title';
            echo "  ✓ Found video: {$videoId} - {$titleSk}\n";
        } else {
            echo "  ⚠️  Entry " . ($item['sys']['id'] ?? 'unknown') . " has no videoId\n";
        }
    }
    
    // Get list of existing images before sync (to clean up old ones)
    $existingImages = [];
    if (is_dir($IMAGES_DIR)) {
        $files = scandir($IMAGES_DIR);
        foreach ($files as $file) {
            if ($file !== '.' && $file !== '..' && is_file($IMAGES_DIR . DIRECTORY_SEPARATOR . $file)) {
                $existingImages[] = $file;
            }
        }
    }
    
    // Process photos and download images
    echo "\n📸 Processing photos and downloading images...\n";
    $photos = [];
    $photoItems = $data['data']['fotografiaCollection']['items'] ?? [];
    $downloadedImages = 0;
    $failedDownloads = 0;
    $currentImageFiles = []; // Track which images are in current sync
    
    foreach ($photoItems as $index => $item) {
        $photo = [
            'title' => [
                'sk' => $item['fotografiaNadpisSk'] ?? null,
                'en' => $item['fotografiaNadpisEn'] ?? null,
                'de' => $item['fotografiaNadpisDe'] ?? null
            ],
            'images' => []
        ];
        
        $imageItems = $item['fotkyCollection']['items'] ?? [];
        foreach ($imageItems as $image) {
            $fileName = $image['fileName'] ?? null;
            $imageUrl = $image['url'] ?? null;
            
            $localUrl = null;
            
            // Download image if URL is provided
            if ($imageUrl && $fileName) {
                $localFileName = $fileName;
                $localFilePath = $IMAGES_DIR . DIRECTORY_SEPARATOR . $localFileName;
                
                // Track this file as current (exists in Contentful)
                $currentImageFiles[] = $localFileName;
                
                // Ensure images directory exists
                if (!is_dir($IMAGES_DIR)) {
                    mkdir($IMAGES_DIR, 0755, true);
                }
                
                // Check if file already exists
                if (file_exists($localFilePath)) {
                    echo "    ⏭️  Image already exists: {$localFileName}\n";
                    $localUrl = '/assets/contentful/images/' . $localFileName;
                } else {
                    // Download image using cURL for better error handling
                    echo "    ⬇️  Downloading: {$fileName}...\n";
                    $ch = curl_init($imageUrl);
                    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
                    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
                    $imageData = curl_exec($ch);
                    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                    $error = curl_error($ch);
                    curl_close($ch);
                    
                    if ($imageData !== false && $httpCode === 200) {
                        // Ensure directory exists before writing
                        if (!is_dir($IMAGES_DIR)) {
                            mkdir($IMAGES_DIR, 0755, true);
                        }
                        if (file_put_contents($localFilePath, $imageData) !== false) {
                            $downloadedImages++;
                            $localUrl = '/assets/contentful/images/' . $localFileName;
                            echo "      ✅ Downloaded: {$localFileName}\n";
                        } else {
                            $failedDownloads++;
                            echo "      ❌ Failed to save: {$localFileName}\n";
                        }
                    } else {
                        $failedDownloads++;
                        echo "      ❌ Failed to download: {$fileName} (HTTP {$httpCode})" . ($error ? " - {$error}" : "") . "\n";
                    }
                }
            }
            
            // Only add image if we have a local URL
            if ($localUrl) {
                $photo['images'][] = [
                    'url' => $localUrl
                ];
            }
        }
        
        $photos[] = $photo;
        $titleSk = $item['fotografiaNadpisSk'] ?? 'No title';
        $imageCount = count($photo['images']);
        echo "  ✓ Processed photo: {$titleSk} ({$imageCount} image(s))\n";
    }
    
    if ($downloadedImages > 0 || $failedDownloads > 0) {
        echo "\n📥 Download summary:\n";
        echo "   ✅ Downloaded: {$downloadedImages} image(s)\n";
        if ($failedDownloads > 0) {
            echo "   ❌ Failed: {$failedDownloads} image(s)\n";
        }
    }
    
    // Clean up images that are no longer in Contentful
    echo "\n🧹 Cleaning up old images...\n";
    $deletedImages = 0;
    $currentImageFiles = array_unique($currentImageFiles); // Remove duplicates
    
    foreach ($existingImages as $existingFile) {
        if (!in_array($existingFile, $currentImageFiles)) {
            $fileToDelete = $IMAGES_DIR . DIRECTORY_SEPARATOR . $existingFile;
            if (unlink($fileToDelete)) {
                $deletedImages++;
                echo "  🗑️  Deleted old image: {$existingFile}\n";
            } else {
                echo "  ⚠️  Failed to delete: {$existingFile}\n";
            }
        }
    }
    
    if ($deletedImages > 0) {
        echo "   ✅ Deleted {$deletedImages} old image(s)\n";
    } else {
        echo "   ✓ No old images to delete\n";
    }
    
    // Prepare YouTube videos output
    $youtubeOutput = [
        'syncedAt' => date('Y-m-d H:i:s'),
        'totalVideos' => count($videos),
        'videos' => $videos
    ];
    
    // Prepare photos output
    $photosOutput = [
        'syncedAt' => date('Y-m-d H:i:s'),
        'totalPhotos' => count($photos),
        'photos' => $photos
    ];
    
    // Write YouTube videos to JSON file
    $youtubeJson = json_encode($youtubeOutput, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if (file_put_contents($YOUTUBE_OUTPUT_FILE, $youtubeJson) === false) {
        throw new Exception("Failed to write output file: {$YOUTUBE_OUTPUT_FILE}");
    }
    
    // Write photos to JSON file
    $photosJson = json_encode($photosOutput, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if (file_put_contents($PHOTOS_OUTPUT_FILE, $photosJson) === false) {
        throw new Exception("Failed to write output file: {$PHOTOS_OUTPUT_FILE}");
    }
    
    echo "\n✅ Successfully synchronized:\n";
    echo "   📹 {$youtubeOutput['totalVideos']} video(s) → {$YOUTUBE_OUTPUT_FILE}\n";
    echo "   📸 {$photosOutput['totalPhotos']} photo(s) → {$PHOTOS_OUTPUT_FILE}\n";
    if ($downloadedImages > 0) {
        echo "   🖼️  {$downloadedImages} image(s) downloaded → {$IMAGES_DIR}\n";
    }
    if ($deletedImages > 0) {
        echo "   🗑️  {$deletedImages} old image(s) deleted\n";
    }
    
    echo "\n✨ Synchronization completed successfully!\n";
    
    // If web request, return JSON response
    if ($isWebRequest) {
        $output = ob_get_clean();
        header('Content-Type: application/json');
        echo json_encode([
            'success' => true,
            'message' => 'Synchronization completed successfully',
            'totalVideos' => count($videos),
            'totalPhotos' => count($photos),
            'downloadedImages' => $downloadedImages,
            'failedDownloads' => $failedDownloads,
            'deletedImages' => $deletedImages,
            'youtubeOutputFile' => $YOUTUBE_OUTPUT_FILE,
            'photosOutputFile' => $PHOTOS_OUTPUT_FILE,
            'imagesDirectory' => $IMAGES_DIR,
            'output' => $output
        ], JSON_PRETTY_PRINT);
        exit(0);
    }
    
} catch (\Exception $e) {
    $errorMessage = "\n❌ Error during synchronization:\n";
    $errorMessage .= "   " . $e->getMessage() . "\n";
    $errorMessage .= "   File: " . $e->getFile() . "\n";
    $errorMessage .= "   Line: " . $e->getLine() . "\n";
    
    echo $errorMessage;
    
    // If web request, return JSON error response
    if ($isWebRequest) {
        $output = ob_get_clean();
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'output' => $output
        ], JSON_PRETTY_PRINT);
        exit(1);
    }
    
    exit(1);
}

