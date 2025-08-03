const std = @import("std");
const Router = @import("router.zig");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    const args = try std.process.argsAlloc(allocator);
    defer std.process.argsFree(allocator, args);

    const ip = if (args.len < 2) "127.0.0.1" else args[1];
    const port = if (args.len < 3) 8080 else try std.fmt.parseInt(u16, args[2], 10);

    var router = try Router.init(allocator, ip, port);
    defer router.deinit();
    router.startServer();

    std.debug.print("\rExit\n", .{});
}
