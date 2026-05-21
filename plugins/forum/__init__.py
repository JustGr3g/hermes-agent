"""The Forum — a contemplative visualization of Athena's cognitive state.

The dashboard extension is discovered from dashboard/manifest.json. The
standalone plugin entry point is a no-op; the dashboard is the surface.
"""


def register(ctx):
    """Register no agent tools; dashboard assets are loaded by Hermes Web."""
    return None
