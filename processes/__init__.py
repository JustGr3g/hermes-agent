"""Processes package — deterministic workflow definitions.

Each module registers a Process subclass with process_registry at import
time. The registry is auto-discovered and processes run via:

    from processes.registry import process_registry
    result = process_registry.run("daily_summary", inputs={...})
"""
