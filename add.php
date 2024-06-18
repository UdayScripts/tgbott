<!DOCTYPE html>
<html>
<head>
    <title>Add New Script</title>
</head>
<body>
    <h2>Add New Script</h2>
    <?php
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Get form data
        $title = $_POST['title'];
        $scid = $_POST['scid'];
        $description = $_POST['description'];
        $thumb_url = $_POST['thumb_url'];
        $prc = $_POST['prc'];
        $ext = $_POST['ext'];
        $size = $_POST['size'];
        $admin = $_POST['admin'];
        $file_id = $_POST['file_id'];

        // Load existing scripts
        $json_file = 'scripts.json';
        $scripts = [];
        if (file_exists($json_file)) {
            $scripts = json_decode(file_get_contents($json_file), true);
        }

        // Determine the next ID
        $id = count($scripts);

        // Create new script array
        $new_script = [
            'id' => $id,
            'title' => $title,
            'scid' => $scid,
            'description' => $description,
            'thumb_url' => $thumb_url,
            'prc' => $prc,
            'ext' => $ext,
            'size' => $size,
            'admin' => $admin,
            'file_id' => $file_id
        ];

        // Append new script to existing scripts
        $scripts[] = $new_script;

        // Save updated scripts to JSON file
        file_put_contents($json_file, json_encode($scripts, JSON_PRETTY_PRINT));

        echo 'Script added successfully!';
    } else {
        echo 'Invalid request method.';
    }
    ?>

    <form action="" method="post">
        <label for="title">Title:</label>
        <input type="text" id="title" name="title" required><br><br>

        <label for="scid">SCID:</label>
        <input type="text" id="scid" name="scid" required><br><br>

        <label for="description">Description:</label>
        <textarea id="description" name="description" required></textarea><br><br>

        <label for="thumb_url">Thumbnail URL:</label>
        <input type="url" id="thumb_url" name="thumb_url" required><br><br>

        <label for="prc">Price:</label>
        <input type="number" id="prc" name="prc" required><br><br>

        <label for="ext">Extension:</label>
        <input type="text" id="ext" name="ext" required><br><br>

        <label for="size">Size:</label>
        <input type="text" id="size" name="size" required><br><br>

        <label for="admin">Admin:</label>
        <input type="number" id="admin" name="admin" required><br><br>

        <label for="file_id">File ID:</label>
        <input type="text" id="file_id" name="file_id" required><br><br>

        <input type="submit" value="Add Script">
    </form>
</body>
</html>
