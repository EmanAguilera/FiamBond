import boto3
from botocore.exceptions import ClientError

# --- Configuration ---
# This endpoint URL tells boto3 to send requests to LocalStack instead of AWS.
LOCALSTACK_ENDPOINT_URL = "http://localhost:4566"

# The name of the bucket you want to create.
BUCKET_NAME = "fiambond-local-test-bucket"

# You can use any dummy credentials for LocalStack.
AWS_ACCESS_KEY_ID = "test"
AWS_SECRET_ACCESS_KEY = "test"
AWS_REGION = "us-east-1"


def create_s3_bucket(bucket_name: str):
    """
    Creates an S3 bucket in LocalStack.

    Args:
        bucket_name: The name of the bucket to create.
    """
    print(f"Attempting to create S3 bucket: {bucket_name}")

    try:
        # Initialize the S3 client, pointing it to the LocalStack endpoint. [1, 6]
        s3_client = boto3.client(
            "s3",
            endpoint_url=LOCALSTACK_ENDPOINT_URL,
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            region_name=AWS_REGION,
        )

        # Create the bucket. [3]
        s3_client.create_bucket(Bucket=bucket_name)

        print(f"✅ Bucket '{bucket_name}' created successfully!")

    except ClientError as e:
        # Handle the case where the bucket already exists.
        if e.response["Error"]["Code"] == "BucketAlreadyOwnedByYou":
            print(f"⚠️ Bucket '{bucket_name}' already exists.")
        else:
            # Handle other potential AWS errors.
            print(f"❌ An error occurred: {e}")
    except Exception as e:
        # Handle other exceptions, like connection errors.
        print(f"❌ An unexpected error occurred: {e}")


if __name__ == "__main__":
    create_s3_bucket(BUCKET_NAME)