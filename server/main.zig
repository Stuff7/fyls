const std = @import("std");
const net = std.net;
const http = std.http;
const fs = std.fs;
const json = std.json;

const FileInfo = struct {
    name: []const u8,
    absolute_path: []const u8,
    size: u64,
    kind: []const u8,
    created: ?i128,
    modified: i128,
    is_dir: bool,
};

fn getFileKind(entry_kind: fs.File.Kind, filename: []const u8) []const u8 {
    switch (entry_kind) {
        .directory => return "directory",
        .sym_link => return "symlink",
        .block_device => return "block_device",
        .character_device => return "character_device",
        .named_pipe => return "named_pipe",
        .unix_domain_socket => return "unix_socket",
        .whiteout => return "whiteout",
        .door => return "door",
        .event_port => return "event_port",
        .unknown => return "unknown",
        .file => {
            const ext_start = std.mem.lastIndexOf(u8, filename, ".");
            if (ext_start == null) return "file";

            const ext = filename[ext_start.? + 1 ..];

            if (std.ascii.eqlIgnoreCase(ext, "jpg") or
                std.ascii.eqlIgnoreCase(ext, "jpeg") or
                std.ascii.eqlIgnoreCase(ext, "png") or
                std.ascii.eqlIgnoreCase(ext, "gif") or
                std.ascii.eqlIgnoreCase(ext, "bmp") or
                std.ascii.eqlIgnoreCase(ext, "svg") or
                std.ascii.eqlIgnoreCase(ext, "webp") or
                std.ascii.eqlIgnoreCase(ext, "tiff") or
                std.ascii.eqlIgnoreCase(ext, "ico") or
                std.ascii.eqlIgnoreCase(ext, "heic") or
                std.ascii.eqlIgnoreCase(ext, "avif"))
            {
                return "image";
            }

            if (std.ascii.eqlIgnoreCase(ext, "mp4") or
                std.ascii.eqlIgnoreCase(ext, "avi") or
                std.ascii.eqlIgnoreCase(ext, "mkv") or
                std.ascii.eqlIgnoreCase(ext, "mov") or
                std.ascii.eqlIgnoreCase(ext, "wmv") or
                std.ascii.eqlIgnoreCase(ext, "flv") or
                std.ascii.eqlIgnoreCase(ext, "webm") or
                std.ascii.eqlIgnoreCase(ext, "m4v") or
                std.ascii.eqlIgnoreCase(ext, "3gp") or
                std.ascii.eqlIgnoreCase(ext, "ogv"))
            {
                return "video";
            }

            if (std.ascii.eqlIgnoreCase(ext, "mp3") or
                std.ascii.eqlIgnoreCase(ext, "wav") or
                std.ascii.eqlIgnoreCase(ext, "flac") or
                std.ascii.eqlIgnoreCase(ext, "aac") or
                std.ascii.eqlIgnoreCase(ext, "ogg") or
                std.ascii.eqlIgnoreCase(ext, "wma") or
                std.ascii.eqlIgnoreCase(ext, "m4a") or
                std.ascii.eqlIgnoreCase(ext, "opus") or
                std.ascii.eqlIgnoreCase(ext, "aiff"))
            {
                return "audio";
            }

            if (std.ascii.eqlIgnoreCase(ext, "txt") or
                std.ascii.eqlIgnoreCase(ext, "md") or
                std.ascii.eqlIgnoreCase(ext, "rst") or
                std.ascii.eqlIgnoreCase(ext, "log") or
                std.ascii.eqlIgnoreCase(ext, "cfg") or
                std.ascii.eqlIgnoreCase(ext, "conf") or
                std.ascii.eqlIgnoreCase(ext, "ini") or
                std.ascii.eqlIgnoreCase(ext, "yaml") or
                std.ascii.eqlIgnoreCase(ext, "yml") or
                std.ascii.eqlIgnoreCase(ext, "toml") or
                std.ascii.eqlIgnoreCase(ext, "json") or
                std.ascii.eqlIgnoreCase(ext, "xml") or
                std.ascii.eqlIgnoreCase(ext, "csv"))
            {
                return "text";
            }

            if (std.ascii.eqlIgnoreCase(ext, "c") or
                std.ascii.eqlIgnoreCase(ext, "cpp") or
                std.ascii.eqlIgnoreCase(ext, "cc") or
                std.ascii.eqlIgnoreCase(ext, "cxx") or
                std.ascii.eqlIgnoreCase(ext, "h") or
                std.ascii.eqlIgnoreCase(ext, "hpp") or
                std.ascii.eqlIgnoreCase(ext, "py") or
                std.ascii.eqlIgnoreCase(ext, "js") or
                std.ascii.eqlIgnoreCase(ext, "ts") or
                std.ascii.eqlIgnoreCase(ext, "java") or
                std.ascii.eqlIgnoreCase(ext, "rs") or
                std.ascii.eqlIgnoreCase(ext, "go") or
                std.ascii.eqlIgnoreCase(ext, "zig") or
                std.ascii.eqlIgnoreCase(ext, "php") or
                std.ascii.eqlIgnoreCase(ext, "rb") or
                std.ascii.eqlIgnoreCase(ext, "pl") or
                std.ascii.eqlIgnoreCase(ext, "sh") or
                std.ascii.eqlIgnoreCase(ext, "bash") or
                std.ascii.eqlIgnoreCase(ext, "zsh") or
                std.ascii.eqlIgnoreCase(ext, "ps1") or
                std.ascii.eqlIgnoreCase(ext, "bat"))
            {
                return "code";
            }

            if (std.ascii.eqlIgnoreCase(ext, "pdf") or
                std.ascii.eqlIgnoreCase(ext, "doc") or
                std.ascii.eqlIgnoreCase(ext, "docx") or
                std.ascii.eqlIgnoreCase(ext, "odt") or
                std.ascii.eqlIgnoreCase(ext, "rtf") or
                std.ascii.eqlIgnoreCase(ext, "xls") or
                std.ascii.eqlIgnoreCase(ext, "xlsx") or
                std.ascii.eqlIgnoreCase(ext, "ods") or
                std.ascii.eqlIgnoreCase(ext, "ppt") or
                std.ascii.eqlIgnoreCase(ext, "pptx") or
                std.ascii.eqlIgnoreCase(ext, "odp"))
            {
                return "document";
            }

            if (std.ascii.eqlIgnoreCase(ext, "zip") or
                std.ascii.eqlIgnoreCase(ext, "tar") or
                std.ascii.eqlIgnoreCase(ext, "gz") or
                std.ascii.eqlIgnoreCase(ext, "bz2") or
                std.ascii.eqlIgnoreCase(ext, "xz") or
                std.ascii.eqlIgnoreCase(ext, "7z") or
                std.ascii.eqlIgnoreCase(ext, "rar") or
                std.ascii.eqlIgnoreCase(ext, "deb") or
                std.ascii.eqlIgnoreCase(ext, "rpm") or
                std.ascii.eqlIgnoreCase(ext, "dmg") or
                std.ascii.eqlIgnoreCase(ext, "iso"))
            {
                return "archive";
            }

            if (std.ascii.eqlIgnoreCase(ext, "exe") or
                std.ascii.eqlIgnoreCase(ext, "msi") or
                std.ascii.eqlIgnoreCase(ext, "app") or
                std.ascii.eqlIgnoreCase(ext, "deb") or
                std.ascii.eqlIgnoreCase(ext, "rpm") or
                std.ascii.eqlIgnoreCase(ext, "apk") or
                std.ascii.eqlIgnoreCase(ext, "dmg"))
            {
                return "executable";
            }

            if (std.ascii.eqlIgnoreCase(ext, "html") or
                std.ascii.eqlIgnoreCase(ext, "htm") or
                std.ascii.eqlIgnoreCase(ext, "css") or
                std.ascii.eqlIgnoreCase(ext, "scss") or
                std.ascii.eqlIgnoreCase(ext, "sass") or
                std.ascii.eqlIgnoreCase(ext, "less"))
            {
                return "web";
            }

            if (std.ascii.eqlIgnoreCase(ext, "ttf") or
                std.ascii.eqlIgnoreCase(ext, "otf") or
                std.ascii.eqlIgnoreCase(ext, "woff") or
                std.ascii.eqlIgnoreCase(ext, "woff2") or
                std.ascii.eqlIgnoreCase(ext, "eot"))
            {
                return "font";
            }

            return "file";
        },
    }
}

pub fn main() !void {
    const addr = net.Address.parseIp4("127.0.0.1", 8080) catch |err| {
        std.debug.print("An error occurred while resolving the IP address: {}\n", .{err});
        return;
    };
    var server = try addr.listen(.{});
    std.debug.print("Server listening on http://127.0.0.1:8080\n", .{});
    std.debug.print("Try: GET /list?path=/absolute/path/to/directory\n", .{});
    startServer(&server);
}

fn startServer(server: *net.Server) void {
    while (true) {
        var connection = server.accept() catch |err| {
            std.debug.print("Connection to client interrupted: {}\n", .{err});
            continue;
        };
        defer connection.stream.close();
        var read_buffer: [4096]u8 = undefined;
        var http_server = http.Server.init(connection, &read_buffer);
        var request = http_server.receiveHead() catch |err| {
            std.debug.print("Could not read head: {}\n", .{err});
            continue;
        };
        handleRequest(&request) catch |err| {
            std.debug.print("Could not handle request: {}\n", .{err});
            continue;
        };
    }
}

fn handleRequest(request: *http.Server.Request) !void {
    std.debug.print("Handling request for {s}\n", .{request.head.target});

    if (std.mem.startsWith(u8, request.head.target, "/list")) {
        try handleDirectoryList(request);
    } else {
        try request.respond("Hello http!\nUse /list?path=/absolute/path/to/directory to list directory contents", .{});
    }
}

fn handleDirectoryList(request: *http.Server.Request) !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    const target = request.head.target;
    const query_start = std.mem.indexOf(u8, target, "?path=");

    if (query_start == null) {
        try request.respond("Error: Missing 'path' query parameter. Use /list?path=/absolute/path/to/directory", .{ .status = .bad_request });
        return;
    }

    const path_start = query_start.? + "?path=".len;
    var dir_path = target[path_start..];

    // URL decode the path (basic implementation for common cases)
    var decoded_path = try allocator.alloc(u8, dir_path.len);
    defer allocator.free(decoded_path);
    var decoded_len: usize = 0;

    var i: usize = 0;
    while (i < dir_path.len) {
        if (dir_path[i] == '%' and i + 2 < dir_path.len) {
            // Simple hex decoding for %20 (space) and other common encodings
            const hex_str = dir_path[i + 1 .. i + 3];
            if (std.fmt.parseInt(u8, hex_str, 16)) |decoded_char| {
                decoded_path[decoded_len] = decoded_char;
                i += 3;
            } else |_| {
                decoded_path[decoded_len] = dir_path[i];
                i += 1;
            }
        } else {
            decoded_path[decoded_len] = dir_path[i];
            i += 1;
        }
        decoded_len += 1;
    }

    const final_path = decoded_path[0..decoded_len];

    listDirectory(request, allocator, final_path) catch |err| {
        const error_msg = switch (err) {
            error.FileNotFound => "Error: Directory not found",
            error.AccessDenied => "Error: Access denied to directory",
            error.NotDir => "Error: Path is not a directory",
            else => "Error: Could not access directory",
        };
        std.debug.print("{any}\n", .{err});
        request.respond(error_msg, .{ .status = .bad_request }) catch {};
    };
}

fn listDirectory(request: *http.Server.Request, allocator: std.mem.Allocator, dir_path: []const u8) !void {
    var dir = fs.openDirAbsolute(dir_path, .{ .iterate = true }) catch |err| {
        return err;
    };
    defer dir.close();

    var file_list = std.ArrayList(FileInfo).init(allocator);
    defer {
        for (file_list.items) |item| {
            allocator.free(item.name);
            allocator.free(item.absolute_path);
            allocator.free(item.kind);
        }
        file_list.deinit();
    }

    var iterator = dir.iterate();
    while (try iterator.next()) |entry| {
        const absolute_path = try fs.path.join(allocator, &[_][]const u8{ dir_path, entry.name });

        const stat = dir.statFile(entry.name) catch |err| {
            std.debug.print("Could not stat file {s}: {}\n", .{ entry.name, err });
            continue;
        };

        const kind_str = getFileKind(entry.kind, entry.name);

        const file_info = FileInfo{
            .name = try allocator.dupe(u8, entry.name),
            .absolute_path = absolute_path,
            .size = stat.size,
            .kind = try allocator.dupe(u8, kind_str),
            .created = stat.ctime,
            .modified = stat.mtime,
            .is_dir = entry.kind == .directory,
        };

        try file_list.append(file_info);
    }

    var json_buf = try std.ArrayList(u8).initCapacity(allocator, file_list.items.len * 500);
    defer json_buf.deinit();
    json_buf.expandToCapacity();

    const json_output = json_buf.items;
    var fixed_writer: std.io.Writer = .fixed(json_output);

    const fmt = json.fmt(file_list.items, .{});
    try fmt.format(&fixed_writer);
    const json_string = fixed_writer.buffered();

    const headers = [_]http.Header{
        .{ .name = "content-type", .value = "application/json" },
    };

    try request.respond(json_string, .{ .extra_headers = &headers });
}
