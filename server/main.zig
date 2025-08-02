const std = @import("std");
const net = std.net;
const http = std.http;
const fs = std.fs;
const print = std.debug.print;

const BUFFER_SIZE = 4096;
const PUBLIC_DIR = "dist";

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    const addr = net.Address.parseIp4("127.0.0.1", 9090) catch |err| {
        print("An error occurred while resolving the IP address: {}\n", .{err});
        return;
    };

    var server = try addr.listen(.{});
    print("Server listening on http://127.0.0.1:9090\n", .{});
    print("Serving files from './{s}' directory\n", .{PUBLIC_DIR});

    startServer(&server, allocator);
}

fn startServer(server: *net.Server, allocator: std.mem.Allocator) void {
    while (true) {
        var connection = server.accept() catch |err| {
            print("Connection to client interrupted: {}\n", .{err});
            continue;
        };
        defer connection.stream.close();

        var read_buffer: [BUFFER_SIZE]u8 = undefined;
        var http_server = http.Server.init(connection, &read_buffer);
        var request = http_server.receiveHead() catch |err| {
            print("Could not read head: {}\n", .{err});
            continue;
        };

        handleRequest(&request, allocator) catch |err| {
            print("Could not handle request: {}\n", .{err});
            continue;
        };
    }
}

fn handleRequest(request: *http.Server.Request, allocator: std.mem.Allocator) !void {
    const target = request.head.target;
    print("Handling request for {s}\n", .{target});

    var path = target;
    if (std.mem.indexOf(u8, target, "?")) |query_start| {
        path = target[0..query_start];
    }

    if (std.mem.eql(u8, path, "/")) {
        path = "/index.html";
    }

    const file_path = try std.fmt.allocPrint(allocator, "{s}{s}", .{ PUBLIC_DIR, path });
    defer allocator.free(file_path);

    // Security check: prevent directory traversal
    if (std.mem.indexOf(u8, path, "..") != null) {
        try sendErrorResponse(request, .forbidden, "403 Forbidden");
        return;
    }

    serveFile(request, file_path, allocator) catch |err| switch (err) {
        error.FileNotFound => {
            try sendErrorResponse(request, .not_found, "404 Not Found");
        },
        error.IsDir => {
            const index_path = try std.fmt.allocPrint(allocator, "{s}/index.html", .{file_path});
            defer allocator.free(index_path);

            serveFile(request, index_path, allocator) catch {
                try sendErrorResponse(request, .forbidden, "403 Forbidden - Directory listing not allowed");
            };
        },
        else => {
            try sendErrorResponse(request, .internal_server_error, "500 Internal Server Error");
        },
    };
}

fn serveFile(request: *http.Server.Request, file_path: []const u8, allocator: std.mem.Allocator) !void {
    const file = fs.cwd().openFile(file_path, .{}) catch |err| switch (err) {
        error.FileNotFound => return error.FileNotFound,
        error.IsDir => return error.IsDir,
        else => return err,
    };
    defer file.close();

    const file_size = try file.getEndPos();
    const content = try allocator.alloc(u8, file_size);
    defer allocator.free(content);

    _ = try file.readAll(content);

    const content_type = getContentType(file_path);

    try request.respond(content, .{
        .extra_headers = &.{
            .{ .name = "content-type", .value = content_type },
            .{ .name = "cache-control", .value = "public, max-age=3600" },
        },
    });

    print("Served {s} ({} bytes) as {s}\n", .{ file_path, file_size, content_type });
}

fn sendErrorResponse(request: *http.Server.Request, status: http.Status, message: []const u8) !void {
    const html_response = std.fmt.allocPrint(std.heap.page_allocator, "<!DOCTYPE html><html><head><title>{s}</title></head><body><h1>{s}</h1></body></html>", .{ message, message }) catch return;
    defer std.heap.page_allocator.free(html_response);

    try request.respond(html_response, .{
        .status = status,
        .extra_headers = &.{
            .{ .name = "content-type", .value = "text/html; charset=utf-8" },
        },
    });

    print("Sent error response: {s}\n", .{message});
}

fn getContentType(file_path: []const u8) []const u8 {
    if (std.mem.endsWith(u8, file_path, ".html") or std.mem.endsWith(u8, file_path, ".htm")) {
        return "text/html; charset=utf-8";
    } else if (std.mem.endsWith(u8, file_path, ".css")) {
        return "text/css; charset=utf-8";
    } else if (std.mem.endsWith(u8, file_path, ".js")) {
        return "application/javascript; charset=utf-8";
    } else if (std.mem.endsWith(u8, file_path, ".json")) {
        return "application/json; charset=utf-8";
    } else if (std.mem.endsWith(u8, file_path, ".png")) {
        return "image/png";
    } else if (std.mem.endsWith(u8, file_path, ".jpg") or std.mem.endsWith(u8, file_path, ".jpeg")) {
        return "image/jpeg";
    } else if (std.mem.endsWith(u8, file_path, ".gif")) {
        return "image/gif";
    } else if (std.mem.endsWith(u8, file_path, ".svg")) {
        return "image/svg+xml";
    } else if (std.mem.endsWith(u8, file_path, ".ico")) {
        return "image/x-icon";
    } else if (std.mem.endsWith(u8, file_path, ".webp")) {
        return "image/webp";
    } else if (std.mem.endsWith(u8, file_path, ".txt")) {
        return "text/plain; charset=utf-8";
    } else if (std.mem.endsWith(u8, file_path, ".xml")) {
        return "application/xml; charset=utf-8";
    } else if (std.mem.endsWith(u8, file_path, ".pdf")) {
        return "application/pdf";
    } else {
        return "application/octet-stream";
    }
}
