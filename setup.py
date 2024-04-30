from setuptools import setup, find_packages

with open("requirements.txt") as f:
	install_requires = f.read().strip().split("\n")

# get version from __version__ variable in page_app/__init__.py
from page_app import __version__ as version

setup(
	name="page_app",
	version=version,
	description="Butter Activety Page style and function",
	author="hamza alsaqaf",
	author_email="hamza1alsaqaf",
	packages=find_packages(),
	zip_safe=False,
	include_package_data=True,
	install_requires=install_requires
)
