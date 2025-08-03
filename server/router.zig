const std = @import("std");
const u = @import("utils.zig");
const net = std.net;
const http = std.http;
const fs = std.fs;
const json = std.json;

var running = true;
var server_ip: []const u8 = undefined;
var server_port: u16 = undefined;

const Router = @This();
allocator: std.mem.Allocator,
decoded_path: std.ArrayList(u8),
ip: []const u8,
port: u16,
response: std.ArrayList(u8),
server: net.Server,

pub fn init(allocator: std.mem.Allocator, ip: []const u8, port: u16) !Router {
    const addr = net.Address.parseIp4(ip, port) catch |err| {
        std.debug.print("An error occurred while resolving the IP address: {}\n", .{err});
        return error.ParsingAddress;
    };
    server_ip = ip;
    server_port = port;

    return .{
        .allocator = allocator,
        .decoded_path = std.ArrayList(u8).init(allocator),
        .ip = ip,
        .port = port,
        .response = std.ArrayList(u8).init(allocator),
        .server = try addr.listen(.{}),
    };
}

pub fn deinit(self: *Router) void {
    self.decoded_path.deinit();
    self.response.deinit();
    self.server.deinit();
}

pub fn startServer(self: *Router) void {
    std.debug.print("Server listening on http://{s}:{d}\n", .{ self.ip, self.port });
    std.debug.print("Try: GET /list?path=/absolute/path/to/directory\n", .{});
    std.posix.sigaction(std.posix.SIG.INT, &std.posix.Sigaction{
        .handler = .{ .handler = sigintHandler },
        .mask = std.posix.sigemptyset(),
        .flags = 0,
    }, null);

    while (running) {
        var connection = self.server.accept() catch |err| {
            std.debug.print("Connection to client interrupted: {}\n", .{err});
            continue;
        };
        defer connection.stream.close();
        var read_buffer: [4096]u8 = undefined;
        var http_server = http.Server.init(connection, &read_buffer);
        var request = http_server.receiveHead() catch |err| {
            if (err != error.HttpConnectionClosing)
                std.debug.print("Could not read head: {}\n", .{err});
            continue;
        };
        self.handleRequest(&request) catch |err| {
            std.debug.print("Could not handle request: {}\n", .{err});
            continue;
        };
    }
}

fn handleRequest(self: *Router, request: *http.Server.Request) !void {
    std.debug.print("Handling request for {s}\n", .{request.head.target});

    if (std.mem.startsWith(u8, request.head.target, "/list")) {
        try self.handleDirectoryList(request);
    } else {
        try request.respond("Hello http!\nUse /list?path=/absolute/path/to/directory to list directory contents", .{});
    }
}

fn handleDirectoryList(self: *Router, request: *http.Server.Request) !void {
    const target = request.head.target;
    const query_start = std.mem.indexOf(u8, target, "?path=");

    if (query_start == null) {
        try request.respond("Error: Missing 'path' query parameter. Use /list?path=/absolute/path/to/directory", .{ .status = .bad_request });
        return;
    }

    const path_start = query_start.? + "?path=".len;
    const dir_path = target[path_start..];

    try u.resizeRetaining(&self.decoded_path, dir_path.len);
    const decoded_len = try u.decodeURIComponent(dir_path, self.decoded_path.items);
    const final_path = self.decoded_path.items[0..decoded_len];

    self.listDirectory(request, final_path) catch |err| {
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

fn listDirectory(self: *Router, request: *http.Server.Request, dir_path: []const u8) !void {
    var dir = fs.openDirAbsolute(dir_path, .{ .iterate = true }) catch |err| {
        return err;
    };
    defer dir.close();

    var file_list = std.ArrayList(FileInfo).init(self.allocator);
    defer {
        for (file_list.items) |item| {
            self.allocator.free(item.name);
            self.allocator.free(item.path);
            self.allocator.free(item.type);
        }
        file_list.deinit();
    }

    var iterator = dir.iterate();
    while (try iterator.next()) |entry| {
        const absolute_path = try fs.path.join(self.allocator, &[_][]const u8{ dir_path, entry.name });

        const stat = dir.statFile(entry.name) catch |err| {
            std.debug.print("Could not stat file {s}: {}\n", .{ entry.name, err });
            continue;
        };

        const kind_str = u.getFileKind(entry.kind, entry.name);

        const file_info = FileInfo{
            .name = try self.allocator.dupe(u8, entry.name),
            .path = absolute_path,
            .size = stat.size,
            .type = try self.allocator.dupe(u8, kind_str),
            .created = stat.ctime,
            .modified = stat.mtime,
            .isDir = entry.kind == .directory,
        };

        try file_list.append(file_info);
    }

    try u.resizeRetaining(&self.response, file_list.items.len * 500);

    const json_output = self.response.items;
    var fixed_writer: std.io.Writer = .fixed(json_output);

    const fmt = json.fmt(file_list.items, .{});
    try fmt.format(&fixed_writer);
    const json_string = fixed_writer.buffered();

    const headers = [_]http.Header{
        .{ .name = "content-type", .value = "application/json" },
    };

    try request.respond(json_string, .{ .extra_headers = &headers });
}

fn sigintHandler(_: c_int) callconv(.c) void {
    running = false;
    const address = std.net.Address.resolveIp(server_ip, server_port) catch return;
    var stream = std.net.tcpConnectToAddress(address) catch return;
    defer stream.close();
}

const FileInfo = struct {
    name: []const u8,
    path: []const u8,
    size: u64,
    type: []const u8,
    created: i128,
    modified: i128,
    isDir: bool,
};
